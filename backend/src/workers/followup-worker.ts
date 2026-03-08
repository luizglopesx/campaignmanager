import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/database';
import { wuzapiService } from '../services/wuzapi';
import { config } from '../config';

// Conexão Redis
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

// Fila de follow-up
export const followUpQueue = new Queue('follow-up', { connection: connection as any });

interface FollowUpJobData {
  leadId: string;
  templateId?: string;
  attempt: number;
  customMessage?: string;
}

/**
 * Verifica se está dentro do horário de trabalho
 */
function isWithinWorkingHours(start: string, end: string, days: number[]): boolean {
  const now = new Date();
  const currentDay = now.getDay();

  if (!days.includes(currentDay)) return false;

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Substitui variáveis no template
 */
function replaceVariables(content: string, lead: any): string {
  return content
    .replace(/\{\{nome\}\}/gi, lead.name || '')
    .replace(/\{\{telefone\}\}/gi, lead.phone || '')
    .replace(/\{\{email\}\}/gi, lead.email || '')
    .replace(/\{\{empresa\}\}/gi, 'Senhor Colchão')
    .replace(/\{\{vendedor\}\}/gi, 'Equipe Senhor Colchão')
    .replace(/\{\{produto\}\}/gi, lead.metadata?.product || '')
    .replace(/\{\{estagio\}\}/gi, lead.currentStage || '');
}

/**
 * Processa um job de follow-up
 */
async function processFollowUp(job: Job<FollowUpJobData>) {
  const { leadId, templateId, attempt, customMessage } = job.data;

  console.log(`📨 Processando follow-up: lead=${leadId}, tentativa=${attempt}`);

  // Buscar lead
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.warn(`Lead ${leadId} não encontrado, pulando.`);
    return { status: 'SKIPPED', reason: 'Lead não encontrado' };
  }

  // Verificar se ainda está ativo
  if (lead.followUpStatus !== 'ACTIVE') {
    console.log(`Lead ${leadId} não está ativo (${lead.followUpStatus}), pulando.`);
    return { status: 'SKIPPED', reason: `Status: ${lead.followUpStatus}` };
  }

  // Buscar settings
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    throw new Error('Settings não encontradas');
  }

  // Verificar horário de trabalho
  const workingDays = (settings.workingDays as number[]) || [1, 2, 3, 4, 5];
  if (!isWithinWorkingHours(settings.workingHoursStart, settings.workingHoursEnd, workingDays)) {
    // Reagendar para o próximo horário de trabalho
    const delay = 30 * 60 * 1000; // 30 min
    await followUpQueue.add('follow-up', job.data, { delay });
    console.log(`⏰ Fora do horário, reagendado para daqui ${delay / 60000} min`);
    return { status: 'RESCHEDULED', reason: 'Fora do horário de trabalho' };
  }

  // Verificar máximo de tentativas
  if (attempt > (settings.maxFollowUpAttempts || 5)) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { followUpStatus: 'COMPLETED' },
    });
    console.log(`✅ Lead ${leadId} atingiu máximo de tentativas, marcado como COMPLETED`);
    return { status: 'COMPLETED', reason: 'Máximo de tentativas atingido' };
  }

  // Montar mensagem
  let messageContent = customMessage || '';

  if (!messageContent && templateId) {
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (template) {
      messageContent = replaceVariables(template.content, lead);
    }
  }

  if (!messageContent) {
    // Tentar usar um template padrão baseado na tentativa
    const templates = await prisma.messageTemplate.findMany({
      where: { type: 'FOLLOW_UP' },
      orderBy: { createdAt: 'asc' },
    });

    if (templates.length > 0) {
      const templateIndex = Math.min(attempt - 1, templates.length - 1);
      messageContent = replaceVariables(templates[templateIndex].content, lead);
    } else {
      messageContent = `Olá ${lead.name || ''}! Sou da Senhor Colchão. Vi que você demonstrou interesse em nossos produtos. Posso ajudar?`;
    }
  }

  // Enviar via WuzAPI
  const result = await wuzapiService.sendText(lead.phone, messageContent);

  // Registrar no banco
  const followUpMsg = await prisma.followUpMessage.create({
    data: {
      leadId,
      templateId: templateId || null,
      attemptNumber: attempt,
      messageContent,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error || null,
    },
  });

  // Atualizar lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      followUpAttempts: attempt,
      lastMessageSentAt: new Date(),
      lastResponseAt: new Date(),
    },
  });

  // Agendar próxima tentativa se não atingiu máximo
  if (result.success && attempt < (settings.maxFollowUpAttempts || 5)) {
    const intervalDays = settings.defaultFollowUpIntervalDays || 1;
    const delay = intervalDays * 24 * 60 * 60 * 1000; // dias em ms

    await followUpQueue.add('follow-up', {
      leadId,
      templateId,
      attempt: attempt + 1,
    }, {
      delay,
      jobId: `followup-${leadId}-${attempt + 1}`,
    });

    console.log(`📅 Próximo follow-up agendado para ${intervalDays} dia(s)`);
  }

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  if (systemUser) {
    await prisma.auditLog.create({
      data: {
        action: 'FOLLOW_UP_SENT',
        entityType: 'FollowUpMessage',
        entityId: followUpMsg.id,
        details: {
          leadId,
          attempt,
          success: result.success,
          phone: lead.phone,
        } as any,
        userId: systemUser.id,
      },
    });
  }

  console.log(`${result.success ? '✅' : '❌'} Follow-up ${result.success ? 'enviado' : 'falhou'} para ${lead.phone}`);

  return {
    status: result.success ? 'SENT' : 'FAILED',
    messageId: result.messageId,
    error: result.error,
  };
}

/**
 * Inicia o worker de follow-up
 */
export function startFollowUpWorker(): Worker {
  const worker = new Worker('follow-up', processFollowUp, {
    connection: connection as any,
    concurrency: 1, // Processar uma mensagem por vez
    limiter: {
      max: config.maxMessagesPerMinute || 20,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ Follow-up job ${job.id} concluído`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Follow-up job ${job?.id} falhou:`, err.message);
  });

  console.log('🔄 Follow-up worker iniciado');
  return worker;
}

/**
 * Agenda follow-up para um lead
 */
export async function scheduleFollowUp(leadId: string, templateId?: string, delayMs?: number): Promise<void> {
  await followUpQueue.add('follow-up', {
    leadId,
    templateId,
    attempt: 1,
  }, {
    delay: delayMs || 0,
    jobId: `followup-${leadId}-1`,
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  console.log(`📅 Follow-up agendado para lead ${leadId}`);
}
