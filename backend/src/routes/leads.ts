import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/leads
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, stage, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.followUpStatus = status;
    if (stage) where.currentStage = stage;
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

// GET /api/leads/stats/overview
router.get('/stats/overview', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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
