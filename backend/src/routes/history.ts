import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ========================================
// GET /api/history — Lista mensagens enviadas
// ========================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      type = 'all', // 'followup' | 'campaign' | 'all'
      status,
      search,
      dateFrom,
      dateTo,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) {
      const end = new Date(dateTo as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // ---- Follow-up only ----
    if (type === 'followup') {
      const where: any = {};
      if (status) where.status = status;
      if (Object.keys(dateFilter).length) where.sentAt = dateFilter;
      if (search) {
        where.lead = {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string } },
          ],
        };
      }

      const [items, total] = await Promise.all([
        prisma.followUpMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            lead: { select: { name: true, phone: true, currentStage: true } },
            template: { select: { name: true } },
          },
        }),
        prisma.followUpMessage.count({ where }),
      ]);

      return res.json({
        items: items.map((i) => ({ ...i, _type: 'followup' })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // ---- Campaign only ----
    if (type === 'campaign') {
      const where: any = {};
      if (status) where.status = status;
      if (Object.keys(dateFilter).length) where.sentAt = dateFilter;
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.campaignRecipient.findMany({
          where,
          orderBy: { sentAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            campaign: { select: { name: true } },
          },
        }),
        prisma.campaignRecipient.count({ where }),
      ]);

      return res.json({
        items: items.map((i) => ({ ...i, _type: 'campaign' })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // ---- All (merged) ----
    const followupWhere: any = {};
    if (status) followupWhere.status = status;
    if (Object.keys(dateFilter).length) followupWhere.sentAt = dateFilter;
    if (search) {
      followupWhere.lead = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ],
      };
    }

    const campaignWhere: any = {};
    if (status) campaignWhere.status = status;
    if (Object.keys(dateFilter).length) campaignWhere.sentAt = dateFilter;
    if (search) {
      campaignWhere.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const [followupItems, followupTotal, campaignItems, campaignTotal] = await Promise.all([
      prisma.followUpMessage.findMany({
        where: followupWhere,
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          lead: { select: { name: true, phone: true, currentStage: true } },
          template: { select: { name: true } },
        },
      }),
      prisma.followUpMessage.count({ where: followupWhere }),
      prisma.campaignRecipient.findMany({
        where: campaignWhere,
        orderBy: { sentAt: 'desc' },
        take: 500,
        include: { campaign: { select: { name: true } } },
      }),
      prisma.campaignRecipient.count({ where: campaignWhere }),
    ]);

    const merged = [
      ...followupItems.map((i) => ({ ...i, _type: 'followup', _date: i.sentAt || i.createdAt })),
      ...campaignItems.map((i) => ({ ...i, _type: 'campaign', _date: i.sentAt || new Date(0) })),
    ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());

    const total = followupTotal + campaignTotal;
    const paginated = merged.slice(skip, skip + limitNum);

    return res.json({
      items: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET /api/history/export — Exporta CSV
// ========================================
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { type = 'all', status, dateFrom, dateTo } = req.query;

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) {
      const end = new Date(dateTo as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const rows: string[] = [];
    rows.push('Tipo,Destinatário,Telefone,Status,Enviado em,Campanha/Template,Tentativa,Erro');

    if (type === 'followup' || type === 'all') {
      const where: any = {};
      if (status) where.status = status;
      if (Object.keys(dateFilter).length) where.sentAt = dateFilter;

      const items = await prisma.followUpMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
        include: {
          lead: { select: { name: true, phone: true } },
          template: { select: { name: true } },
        },
      });

      for (const item of items) {
        const name = (item.lead?.name || '').replace(/"/g, '""');
        const phone = item.lead?.phone || '';
        const sentAt = item.sentAt ? new Date(item.sentAt).toLocaleString('pt-BR') : '';
        const template = (item.template?.name || '').replace(/"/g, '""');
        const error = (item.errorMessage || '').replace(/"/g, '""');
        rows.push(`Follow-up,"${name}","${phone}",${item.status},"${sentAt}","${template}",${item.attemptNumber},"${error}"`);
      }
    }

    if (type === 'campaign' || type === 'all') {
      const where: any = {};
      if (status) where.status = status;
      if (Object.keys(dateFilter).length) where.sentAt = dateFilter;

      const items = await prisma.campaignRecipient.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: 5000,
        include: { campaign: { select: { name: true } } },
      });

      for (const item of items) {
        const name = (item.name || '').replace(/"/g, '""');
        const sentAt = item.sentAt ? new Date(item.sentAt).toLocaleString('pt-BR') : '';
        const campaign = (item.campaign?.name || '').replace(/"/g, '""');
        const error = (item.errorMessage || '').replace(/"/g, '""');
        rows.push(`Campanha,"${name}","${item.phone}",${item.status},"${sentAt}","${campaign}",,"${error}"`);
      }
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="historico-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET /api/history/audit — Logs de auditoria
// ========================================
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { entityType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
