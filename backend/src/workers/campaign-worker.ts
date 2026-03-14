import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/database';
import { wuzapiService } from '../services/wuzapi';
import { config } from '../config';

// Conexão Redis
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

// Fila de campanha
export const campaignQueue = new Queue('campaign', { connection: connection as any });

interface CampaignJobData {
  campaignId: string;
  recipientId: string;
}

/**
 * Substitui variáveis na mensagem usando dados do destinatário
 */
function replaceVariables(content: string, recipient: any): string {
  return content
    .replace(/\{\{nome\}\}/gi, recipient.name || '')
    .replace(/\{\{telefone\}\}/gi, recipient.phone || '')
    .replace(/\{\{empresa\}\}/gi, 'Senhor Colchão')
    .replace(/\{\{vendedor\}\}/gi, 'Equipe Senhor Colchão');
}

/**
 * Processa envio de campanha para um destinatário
 */
async function processCampaignMessage(job: Job<CampaignJobData>) {
  const { campaignId, recipientId } = job.data;

  console.log(`📨 Campanha: enviando para recipient=${recipientId}`);

  // Buscar campanha com imagens
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!campaign) {
    return { status: 'SKIPPED', reason: 'Campanha não encontrada' };
  }

  // Buscar destinatário
  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient || recipient.status === 'SENT') {
    return { status: 'SKIPPED', reason: 'Destinatário já processado' };
  }

  try {
    // Removida atualização para 'PROCESSING' porque o Enum MessageStatus não a possui
    // E não é estritamente necessário para travar já que a task foi atribuída ao bullmq.

    // Delay aleatório entre destinatários (15-45s) para evitar detecção de bot
    const delayMs = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
    console.log(`⏳ Aguardando ${(delayMs / 1000).toFixed(0)}s antes de enviar para ${recipient.phone}...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    let success = false;
    let errorMessage: string | null = null;

    // Verificar tipo de campanha
    if (campaign.images.length > 0) {
      // Campanha carrossel nativo (cards com texto e botões, min 2 cards)
      const cards = campaign.images.map((card: any) => ({
        header: card.header
          ? replaceVariables(card.header, recipient)
          : '',
        body: card.caption
          ? replaceVariables(card.caption, recipient)
          : '',
        buttons: Array.isArray(card.buttons) ? card.buttons : [],
      }));

      const result = await wuzapiService.sendCarousel(
        recipient.phone,
        {
          body: campaign.description
            ? replaceVariables(campaign.description, recipient)
            : '',
          header: campaign.carouselHeader || undefined,
          footer: campaign.carouselFooter || undefined,
          cards,
        }
      );
      success = result.success;
      errorMessage = result.error || null;
    } else if (campaign.description) {
      // Campanha somente texto
      const message = replaceVariables(campaign.description, recipient);
      const result = await wuzapiService.sendText(recipient.phone, message);
      success = result.success;
      errorMessage = result.error || null;
    } else {
      errorMessage = 'Campanha sem conteúdo (nem imagens nem texto)';
      success = false;
    }

    // Atualizar status do destinatário
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : null,
        errorMessage,
      },
    });

    // Removemos os updates de 'sentCount' e 'failedCount' 
    // porque contamos os destinatários na rota GET on the fly.

    console.log(`${success ? '✅' : '❌'} Campanha ${campaignId} → ${recipient.phone}: ${success ? 'OK' : errorMessage}`);

    return { status: success ? 'SENT' : 'FAILED', error: errorMessage };
  } catch (error: any) {
    // Falha no processamento
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
}

/**
 * Inicia o worker de campanha
 */
export function startCampaignWorker(): Worker {
  const worker = new Worker('campaign', processCampaignMessage, {
    connection: connection as any,
    concurrency: 1,
    limiter: {
      max: config.maxMessagesPerMinute || 20,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    // Verificar se campanha terminou
    checkCampaignCompletion(job.data.campaignId);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Campaign job ${job?.id} falhou:`, err.message);
  });

  console.log('📢 Campaign worker iniciado');
  return worker;
}

/**
 * Verifica se todos os destinatários foram processados e finaliza a campanha
 */
async function checkCampaignCompletion(campaignId: string) {
  const pending = await prisma.campaignRecipient.count({
    where: {
      campaignId,
      status: 'PENDING',
    },
  });

  if (pending === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    });
    console.log(`🏁 Campanha ${campaignId} concluída!`);
  }
}

/**
 * Dispara uma campanha: enfileira todos os destinatários
 */
export async function startCampaign(campaignId: string): Promise<{ queued: number }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { recipients: { where: { status: 'PENDING' } } },
  });

  if (!campaign) throw new Error('Campanha não encontrada');
  if (campaign.recipients.length === 0) throw new Error('Campanha sem destinatários pendentes');

  // Atualizar status da campanha
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'RUNNING',
      startDate: new Date(),
    },
  });

  // Enfileirar cada destinatário (delay real é aplicado dentro do processador)
  for (let i = 0; i < campaign.recipients.length; i++) {
    await campaignQueue.add('campaign-send', {
      campaignId,
      recipientId: campaign.recipients[i].id,
    }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  console.log(`🚀 Campanha ${campaignId} iniciada: ${campaign.recipients.length} destinatários enfileirados`);

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: campaign.createdBy, // obrigatório no AuditLog
      action: 'CAMPAIGN_STARTED',
      entityType: 'Campaign',
      entityId: campaignId,
      details: {
        recipientCount: campaign.recipients.length,
        campaignName: campaign.name,
      } as any,
    },
  });

  return { queued: campaign.recipients.length };
}
