import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatwootService } from '../services/chatwoot';
import { startBroadcast, cancelBroadcast } from '../workers/broadcast-worker';
import { wuzapiService } from '../services/wuzapi';

const router = Router();

// ==========================================
// Chatwoot Labels
// ==========================================

/**
 * GET /api/broadcast/labels
 * Lista todas as labels do Chatwoot
 */
router.get('/labels', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const labels = await chatwootService.listLabels();
    res.json({ labels });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar labels' });
  }
});

/**
 * POST /api/broadcast/contacts-by-label
 * Filtra contatos por label
 */
router.post('/contacts-by-label', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { label } = req.body;
    if (!label) {
      res.status(400).json({ error: 'Label é obrigatória' });
      return;
    }

    const contacts = await chatwootService.filterContactsByLabel(label);
    res.json({ contacts, total: contacts.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao filtrar contatos' });
  }
});

// ==========================================
// Broadcast CRUD
// ==========================================

/**
 * GET /api/broadcast
 * Lista todos os broadcasts
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calcular progresso para cada broadcast
    const result = await Promise.all(
      broadcasts.map(async (b) => {
        const total = await prisma.broadcastRecipient.count({
          where: { broadcastId: b.id },
        });
        const sent = await prisma.broadcastRecipient.count({
          where: { broadcastId: b.id, status: 'SENT' },
        });
        const failed = await prisma.broadcastRecipient.count({
          where: { broadcastId: b.id, status: 'FAILED' },
        });
        return {
          ...b,
          totalRecipients: total,
          sentCount: sent,
          failedCount: failed,
          pendingCount: total - sent - failed,
        };
      })
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar broadcasts' });
  }
});

/**
 * GET /api/broadcast/:id
 * Detalhes de um broadcast com progresso
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast não encontrado' });
      return;
    }

    const total = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id },
    });
    const sent = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id, status: 'SENT' },
    });
    const failed = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id, status: 'FAILED' },
    });

    res.json({
      ...broadcast,
      totalRecipients: total,
      sentCount: sent,
      failedCount: failed,
      pendingCount: total - sent - failed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar broadcast' });
  }
});

/**
 * GET /api/broadcast/:id/progress
 * Progresso em tempo real (para polling do frontend)
 */
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast não encontrado' });
      return;
    }

    const total = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id },
    });
    const sent = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id, status: 'SENT' },
    });
    const failed = await prisma.broadcastRecipient.count({
      where: { broadcastId: broadcast.id, status: 'FAILED' },
    });

    // Último destinatário processado
    const lastProcessed = await prisma.broadcastRecipient.findFirst({
      where: { broadcastId: broadcast.id, status: { in: ['SENT', 'FAILED'] } },
      orderBy: { sentAt: 'desc' },
      select: { name: true, phone: true, status: true, sentAt: true },
    });

    res.json({
      status: broadcast.status,
      total,
      sent,
      failed,
      pending: total - sent - failed,
      progress: total > 0 ? Math.round(((sent + failed) / total) * 100) : 0,
      lastProcessed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar progresso' });
  }
});

/**
 * POST /api/broadcast
 * Cria e inicia um broadcast
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { label, message, mediaUrl, mediaType, name } = req.body;

    if (!label) {
      res.status(400).json({ error: 'Label é obrigatória' });
      return;
    }
    if (!message && !mediaUrl) {
      res.status(400).json({ error: 'Mensagem ou mídia é obrigatória' });
      return;
    }

    // Buscar contatos da label
    const contacts = await chatwootService.filterContactsByLabel(label);
    if (contacts.length === 0) {
      res.status(400).json({ error: 'Nenhum contato encontrado para esta label' });
      return;
    }

    // Criar broadcast
    const broadcast = await prisma.broadcast.create({
      data: {
        name: name || `Broadcast - ${label} - ${new Date().toLocaleDateString('pt-BR')}`,
        message,
        mediaUrl,
        mediaType,
        type: 'MESSAGE',
        status: 'DRAFT',
        labelFilter: label,
        createdBy: req.user!.id,
      },
    });

    // Criar destinatários
    await prisma.broadcastRecipient.createMany({
      data: contacts.map((c) => ({
        broadcastId: broadcast.id,
        chatwootContactId: c.contactId,
        chatwootConversationId: c.conversationId,
        phone: c.phone,
        name: c.name,
        status: 'PENDING' as const,
      })),
    });

    // Iniciar broadcast
    const { queued } = await startBroadcast(broadcast.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BROADCAST_STARTED',
        entityType: 'Broadcast',
        entityId: broadcast.id,
        details: {
          label,
          recipientCount: queued,
          broadcastName: broadcast.name,
        } as any,
      },
    });

    res.json({
      id: broadcast.id,
      status: 'RUNNING',
      queued,
      message: `Broadcast iniciado com ${queued} destinatários`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar broadcast' });
  }
});

/**
 * POST /api/broadcast/:id/cancel
 * Cancela um broadcast em execução
 */
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
    });

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast não encontrado' });
      return;
    }

    if (broadcast.status !== 'RUNNING') {
      res.status(400).json({ error: 'Broadcast não está em execução' });
      return;
    }

    await cancelBroadcast(broadcast.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BROADCAST_CANCELLED',
        entityType: 'Broadcast',
        entityId: broadcast.id,
      },
    });

    res.json({ message: 'Broadcast cancelado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao cancelar broadcast' });
  }
});

/**
 * DELETE /api/broadcast/:id
 * Remove um broadcast (apenas DRAFT, COMPLETED ou CANCELLED)
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
    });

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast não encontrado' });
      return;
    }

    if (broadcast.status === 'RUNNING') {
      res.status(400).json({ error: 'Não é possível remover broadcast em execução. Cancele primeiro.' });
      return;
    }

    await prisma.broadcast.delete({ where: { id } });
    res.json({ message: 'Broadcast removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao remover broadcast' });
  }
});

// ==========================================
// WhatsApp Status (via WuzAPI)
// ==========================================

/**
 * POST /api/broadcast/send-status
 * Posta no Status do WhatsApp (status@broadcast)
 */
router.post('/send-status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mediaUrl, caption, mediaType } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ error: 'URL da mídia é obrigatória para Status' });
      return;
    }

    const result = await wuzapiService.sendStatus(mediaUrl, caption, mediaType);

    if (result.success) {
      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'STATUS_POSTED',
          entityType: 'WhatsAppStatus',
          details: { mediaUrl, caption, mediaType } as any,
        },
      });

      res.json({ success: true, messageId: result.messageId, message: 'Status publicado com sucesso' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao postar status' });
  }
});

export default router;
