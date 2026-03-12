import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/database';
import { chatwootService } from '../services/chatwoot';
import { config } from '../config';

// Conexão Redis
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

// Fila de broadcast
export const broadcastQueue = new Queue('broadcast', { connection: connection as any });

interface BroadcastJobData {
  broadcastId: string;
  recipientId: string;
}

/**
 * Processa envio de broadcast para um destinatário via Chatwoot API
 */
async function processBroadcastMessage(job: Job<BroadcastJobData>) {
  const { broadcastId, recipientId } = job.data;

  console.log(`📡 Broadcast: enviando para recipient=${recipientId}`);

  // Buscar broadcast
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast || broadcast.status === 'CANCELLED') {
    return { status: 'SKIPPED', reason: 'Broadcast cancelado ou não encontrado' };
  }

  // Buscar destinatário
  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient || recipient.status === 'SENT') {
    return { status: 'SKIPPED', reason: 'Destinatário já processado' };
  }

  if (!recipient.chatwootConversationId) {
    await prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: { status: 'FAILED', errorMessage: 'Sem conversation ID do Chatwoot' },
    });
    return { status: 'FAILED', reason: 'Sem conversation ID' };
  }

  try {
    // Delay aleatório entre 15-45s (anti-spam)
    const delayMs = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
    console.log(`⏳ Aguardando ${(delayMs / 1000).toFixed(0)}s antes de enviar para ${recipient.name || recipient.phone}...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Verificar se broadcast ainda está ativo (pode ter sido cancelado durante o delay)
    const freshBroadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!freshBroadcast || freshBroadcast.status === 'CANCELLED') {
      return { status: 'SKIPPED', reason: 'Broadcast cancelado durante delay' };
    }

    let result: { success: boolean; messageId?: number; error?: string };

    // Enviar mensagem via Chatwoot API
    if (broadcast.mediaUrl) {
      // Com anexo (imagem/vídeo)
      result = await chatwootService.sendMessageWithAttachment(
        recipient.chatwootConversationId,
        broadcast.message || '',
        broadcast.mediaUrl
      );
    } else {
      // Somente texto
      result = await chatwootService.sendMessage(
        recipient.chatwootConversationId,
        broadcast.message || ''
      );
    }

    // Atualizar status do destinatário
    await prisma.broadcastRecipient.update({
      where: { id: recipientId },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    });

    console.log(
      `${result.success ? '✅' : '❌'} Broadcast ${broadcastId} → ${recipient.name || recipient.phone}: ${result.success ? 'OK' : result.error}`
    );

    return { status: result.success ? 'SENT' : 'FAILED', error: result.error };
  } catch (error: any) {
    await prisma.broadcastRecipient.update({
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
 * Inicia o worker de broadcast
 */
export function startBroadcastWorker(): Worker {
  const worker = new Worker('broadcast', processBroadcastMessage, {
    connection: connection as any,
    concurrency: 1,
    limiter: {
      max: config.maxMessagesPerMinute || 20,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    checkBroadcastCompletion(job.data.broadcastId);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Broadcast job ${job?.id} falhou:`, err.message);
    if (job) {
      checkBroadcastCompletion(job.data.broadcastId);
    }
  });

  console.log('📡 Broadcast worker iniciado');
  return worker;
}

/**
 * Verifica se todos os destinatários foram processados e finaliza o broadcast
 */
async function checkBroadcastCompletion(broadcastId: string) {
  const pending = await prisma.broadcastRecipient.count({
    where: {
      broadcastId,
      status: 'PENDING',
    },
  });

  if (pending === 0) {
    const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (broadcast && broadcast.status !== 'CANCELLED') {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { status: 'COMPLETED' },
      });
      console.log(`🏁 Broadcast ${broadcastId} concluído!`);
    }
  }
}

/**
 * Dispara um broadcast: enfileira todos os destinatários
 */
export async function startBroadcast(broadcastId: string): Promise<{ queued: number }> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: { recipients: { where: { status: 'PENDING' } } },
  });

  if (!broadcast) throw new Error('Broadcast não encontrado');
  if (broadcast.recipients.length === 0) throw new Error('Broadcast sem destinatários pendentes');

  // Atualizar status
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'RUNNING' },
  });

  // Enfileirar cada destinatário
  for (const recipient of broadcast.recipients) {
    await broadcastQueue.add(
      'broadcast-send',
      {
        broadcastId,
        recipientId: recipient.id,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );
  }

  console.log(`🚀 Broadcast ${broadcastId} iniciado: ${broadcast.recipients.length} destinatários enfileirados`);

  return { queued: broadcast.recipients.length };
}

/**
 * Cancela um broadcast: marca como CANCELLED e limpa jobs pendentes
 */
export async function cancelBroadcast(broadcastId: string): Promise<void> {
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'CANCELLED' },
  });

  // Marcar destinatários pendentes como FAILED
  await prisma.broadcastRecipient.updateMany({
    where: { broadcastId, status: 'PENDING' },
    data: { status: 'FAILED', errorMessage: 'Broadcast cancelado pelo usuário' },
  });

  // Limpar jobs pendentes da fila
  const waiting = await broadcastQueue.getWaiting();
  const delayed = await broadcastQueue.getDelayed();
  const allJobs = [...waiting, ...delayed];

  for (const job of allJobs) {
    if (job.data.broadcastId === broadcastId) {
      await job.remove();
    }
  }

  console.log(`🛑 Broadcast ${broadcastId} cancelado`);
}
