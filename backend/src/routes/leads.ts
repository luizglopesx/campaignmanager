import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatwootService } from '../services/chatwoot';
import { scheduleFollowUp } from '../workers/followup-worker';

const router = Router();

// GET /api/leads
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, stage, search, label, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.followUpStatus = status;
    if (stage) where.currentStage = stage;
    if (label) where.labelFilter = label;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

// GET /api/leads/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        followUpMessages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

// PUT /api/leads/:id/status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { followUpStatus } = z
      .object({ followUpStatus: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'RESPONDED']) })
      .parse(req.body);

    const id = req.params.id as string;
    const lead = await prisma.lead.update({
      where: { id },
      data: { followUpStatus },
    });

    res.json({ lead, message: `Status atualizado para ${followUpStatus}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ==========================================
// POST /api/leads/start-followup-by-label
// Inicia follow-up para contatos de uma etiqueta do Chatwoot
// ==========================================
router.post('/start-followup-by-label', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { label, templateIds } = z
      .object({
        label: z.string().min(1, 'Label é obrigatória'),
        templateIds: z.array(z.string()).min(1, 'Selecione pelo menos um template'),
      })
      .parse(req.body);

    // Buscar contatos da label via Chatwoot
    const contacts = await chatwootService.filterContactsByLabel(label);
    if (contacts.length === 0) {
      res.status(400).json({ error: 'Nenhum contato encontrado para esta etiqueta' });
      return;
    }

    let created = 0;
    let reactivated = 0;
    let skipped = 0;

    for (const contact of contacts) {
      if (!contact.phone) {
        skipped++;
        continue;
      }

      // Verificar se lead já existe
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { chatwootContactId: contact.contactId },
            { phone: contact.phone },
          ],
        },
      });

      if (existing) {
        // Lead existe — reativar se não estiver ativo
        if (existing.followUpStatus !== 'ACTIVE') {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              followUpStatus: 'ACTIVE',
              followUpAttempts: 0,
              labelFilter: label,
              templateIds: templateIds as any,
              lastMessageSentAt: null,
            },
          });
          await scheduleFollowUp(existing.id, templateIds[0], 0);
          reactivated++;
        } else {
          skipped++;
        }
      } else {
        // Criar novo lead
        const lead = await prisma.lead.create({
          data: {
            chatwootContactId: contact.contactId,
            name: contact.name || 'Sem nome',
            phone: contact.phone,
            currentStage: label,
            labelFilter: label,
            templateIds: templateIds as any,
            followUpStatus: 'ACTIVE',
            followUpAttempts: 0,
          },
        });
        await scheduleFollowUp(lead.id, templateIds[0], 0);
        created++;
      }
    }

    // Audit log
    const systemUser = req.user!;
    await prisma.auditLog.create({
      data: {
        userId: systemUser.id,
        action: 'FOLLOWUP_STARTED_BY_LABEL',
        entityType: 'Lead',
        details: {
          label,
          templateIds,
          created,
          reactivated,
          skipped,
          totalContacts: contacts.length,
        } as any,
      },
    });

    res.json({
      success: true,
      message: `Follow-up iniciado: ${created} novos, ${reactivated} reativados, ${skipped} ignorados`,
      stats: { created, reactivated, skipped, totalContacts: contacts.length },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Erro ao iniciar follow-up' });
  }
});

// ==========================================
// PUT /api/leads/bulk-status
// Pausar ou retomar TODOS os leads de uma vez
// ==========================================
router.put('/bulk-status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = z
      .object({ status: z.enum(['PAUSED', 'ACTIVE']) })
      .parse(req.body);

    const fromStatus = status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';

    const result = await prisma.lead.updateMany({
      where: { followUpStatus: fromStatus },
      data: { followUpStatus: status },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: status === 'PAUSED' ? 'FOLLOWUP_BULK_PAUSED' : 'FOLLOWUP_BULK_RESUMED',
        entityType: 'Lead',
        details: { count: result.count, fromStatus, toStatus: status } as any,
      },
    });

    res.json({
      success: true,
      message: `${result.count} leads alterados para ${status}`,
      count: result.count,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Erro ao atualizar status em lote' });
  }
});

// POST /api/leads/:id/trigger-followup — dispara follow-up imediato para um lead
router.post('/:id/trigger-followup', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: String(req.params.id) } });
    if (!lead) { res.status(404).json({ error: 'Lead não encontrado' }); return; }

    const templateIds = (lead.templateIds as string[]) || [];
    await scheduleFollowUp(lead.id, templateIds[0] || undefined, 0);
    res.json({ success: true, message: `Follow-up agendado para ${lead.name}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/stats/overview
router.get('/stats/overview', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [active, paused, completed, responded, totalMessages, todayMessages] = await Promise.all([
      prisma.lead.count({ where: { followUpStatus: 'ACTIVE' } }),
      prisma.lead.count({ where: { followUpStatus: 'PAUSED' } }),
      prisma.lead.count({ where: { followUpStatus: 'COMPLETED' } }),
      prisma.lead.count({ where: { followUpStatus: 'RESPONDED' } }),
      prisma.followUpMessage.count(),
      prisma.followUpMessage.count({
        where: {
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const total = active + paused + completed + responded;
    const responseRate = total > 0 ? ((responded / total) * 100).toFixed(1) : '0';

    res.json({
      stats: {
        leads: { active, paused, completed, responded, total },
        messages: { total: totalMessages, today: todayMessages },
        responseRate: `${responseRate}%`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;

