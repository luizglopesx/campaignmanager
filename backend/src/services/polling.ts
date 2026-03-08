import { kanbanService } from './kanban';
import prisma from '../config/database';
import { scheduleFollowUp } from '../workers/followup-worker';

let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Inicia o polling periódico do Kanban API
 * Verifica novos leads a cada X minutos e agenda follow-ups
 */
export function startPolling(intervalMinutes: number = 5): void {
  if (pollingInterval) {
    console.warn('Polling já está rodando');
    return;
  }

  console.log(`📡 Polling service iniciado (intervalo: ${intervalMinutes} min)`);

  // Executar imediatamente na primeira vez
  poll().catch(console.error);

  // Agendar execuções periódicas
  pollingInterval = setInterval(() => {
    poll().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

/**
 * Para o polling
 */
export function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️  Polling service parado');
  }
}

/**
 * Executa uma iteração do polling
 */
async function poll(): Promise<void> {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings?.chatwootUrl || !settings?.chatwootApiToken) {
      console.log('⚠️  Kanban API não configurado, polling ignorado');
      return;
    }

    // Sincroniza direto da label "meio" do Kanban Chatwoot
    const result = await kanbanService.syncLeadsFromBoard('meio');
    const totalCreated = result.created;
    const totalUpdated = result.updated;

    // Para leads recém-criados, agendar follow-up
    if (totalCreated > 0) {
      const newLeads = await prisma.lead.findMany({
        where: {
          followUpStatus: 'ACTIVE',
          followUpAttempts: 0,
          lastMessageSentAt: null,
        },
        take: totalCreated,
        orderBy: { createdAt: 'desc' },
      });

      for (const lead of newLeads) {
        await scheduleFollowUp(lead.id);
      }

      console.log(`📬 ${newLeads.length} novos follow-ups agendados`);
    }

    if (totalCreated > 0 || totalUpdated > 0) {
      console.log(`🔄 Polling concluído: ${totalCreated} novos leads, ${totalUpdated} atualizados`);
    }
  } catch (error: any) {
    console.error('❌ Erro no polling:', error.message);
  }
}

export const pollingService = {
  startPolling,
  stopPolling,
  poll,
};
