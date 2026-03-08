import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { campaignQueue } from '../workers/campaign-worker';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

const createScheduleSchema = z.object({
  recipientName: z.string().optional(),
  recipientPhone: z.string().min(10, 'Telefone inválido'),
  messageContent: z.string().min(1, 'Mensagem obrigatória'),
  scheduledFor: z.string().transform((s) => new Date(s)),
  campaignId: z.string().optional(),
});

// ========================================
// GET /api/schedule — Lista agendamentos
// ========================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;

    const [schedules, total] = await Promise.all([
      prisma.scheduledMessage.findMany({
        where,
        orderBy: { scheduledFor: 'asc' },
        skip,
        take: parseInt(limit as string),
        include: {
          campaign: { select: { name: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.scheduledMessage.count({ where }),
    ]);

    res.json({
      schedules,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// POST /api/schedule — Cria agendamento
// ========================================
router.post('/', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response) => {
  try {
    const data = createScheduleSchema.parse(req.body);

    if (data.scheduledFor <= new Date()) {
      return res.status(400).json({ error: 'Data de agendamento deve ser no futuro' });
    }

    const { user } = req as any;

    const schedule = await prisma.scheduledMessage.create({
      data: {
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName || null,
        messageContent: data.messageContent,
        scheduledFor: data.scheduledFor,
        status: 'PENDING',
        campaignId: data.campaignId || null,
        createdBy: user.id,
      },
    });

    // Calcular delay e enfileirar
    const delay = data.scheduledFor.getTime() - Date.now();

    await campaignQueue.add('scheduled-message', {
      scheduleId: schedule.id,
      phone: schedule.recipientPhone,
      message: schedule.messageContent,
    }, {
      delay,
      jobId: `schedule-${schedule.id}`,
    });

    res.status(201).json({ schedule, message: 'Agendamento criado com sucesso' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// DELETE /api/schedule/:id — Cancela agendamento
// ========================================
router.delete('/:id', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const schedule = await prisma.scheduledMessage.findUnique({ where: { id } });
    if (!schedule) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (schedule.status !== 'PENDING') {
      return res.status(400).json({ error: 'Agendamento já processado, não pode ser cancelado' });
    }

    // Remover da fila
    const jobId = `schedule-${id}`;
    try {
      const job = await campaignQueue.getJob(jobId);
      if (job) await job.remove();
    } catch {}

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Agendamento cancelado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET /api/schedule/calendar — Agrupa por dia
// ========================================
router.get('/calendar', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (month && typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      startDate = new Date(`${month}-01T00:00:00`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const schedules = await prisma.scheduledMessage.findMany({
      where: { scheduledFor: { gte: startDate, lt: endDate } },
      orderBy: { scheduledFor: 'asc' },
      include: { campaign: { select: { name: true } } },
    });

    // Agrupa por data (YYYY-MM-DD)
    const byDay: Record<string, any[]> = {};
    for (const s of schedules) {
      const dateKey = s.scheduledFor.toISOString().slice(0, 10);
      if (!byDay[dateKey]) byDay[dateKey] = [];
      byDay[dateKey].push(s);
    }

    const monthStr =
      month ||
      `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    res.json({ month: monthStr, byDay, total: schedules.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET /api/schedule/stats — Estatísticas
// ========================================
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [pending, sent, cancelled, total] = await Promise.all([
      prisma.scheduledMessage.count({ where: { status: 'PENDING' } }),
      prisma.scheduledMessage.count({ where: { status: 'SENT' } }),
      prisma.scheduledMessage.count({ where: { status: 'CANCELLED' } }),
      prisma.scheduledMessage.count(),
    ]);

    // Próximos agendamentos
    const upcoming = await prisma.scheduledMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { gte: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 5,
    });

    res.json({ stats: { pending, sent, cancelled, total }, upcoming });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
