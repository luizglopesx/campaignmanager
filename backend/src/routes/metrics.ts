import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ========================================
// GET /api/metrics — Dados para relatórios
// ========================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Gerar array dos últimos 30 dias
    const days: { date: string; followup: number; campaign: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), followup: 0, campaign: 0 });
    }

    // Mensagens follow-up por dia
    const followupMessages = await prisma.followUpMessage.findMany({
      where: { sentAt: { gte: thirtyDaysAgo } },
      select: { sentAt: true },
    });
    for (const msg of followupMessages) {
      if (!msg.sentAt) continue;
      const dateStr = msg.sentAt.toISOString().slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.followup++;
    }

    // Mensagens campanha por dia
    const campaignMessages = await prisma.campaignRecipient.findMany({
      where: { sentAt: { gte: thirtyDaysAgo } },
      select: { sentAt: true },
    });
    for (const msg of campaignMessages) {
      if (!msg.sentAt) continue;
      const dateStr = msg.sentAt.toISOString().slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.campaign++;
    }

    // Funil follow-up
    const [followupActive, followupResponded, followupCompleted, followupPaused] =
      await Promise.all([
        prisma.lead.count({ where: { followUpStatus: 'ACTIVE' } }),
        prisma.lead.count({ where: { followUpStatus: 'RESPONDED' } }),
        prisma.lead.count({ where: { followUpStatus: 'COMPLETED' } }),
        prisma.lead.count({ where: { followUpStatus: 'PAUSED' } }),
      ]);

    // Status de mensagens follow-up
    const followupByStatus = await prisma.followUpMessage.groupBy({
      by: ['status'],
      _count: true,
    });

    // Status de destinatários de campanhas
    const campaignRecipientByStatus = await prisma.campaignRecipient.groupBy({
      by: ['status'],
      _count: true,
    });

    // Campanhas por status
    const campaignsByStatus = await prisma.campaign.groupBy({
      by: ['status'],
      _count: true,
    });

    // Top 5 campanhas mais recentes com métricas
    const topCampaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    });

    const topCampaignsWithMetrics = await Promise.all(
      topCampaigns.map(async (c) => {
        const sent = await prisma.campaignRecipient.count({
          where: { campaignId: c.id, status: 'SENT' },
        });
        const failed = await prisma.campaignRecipient.count({
          where: { campaignId: c.id, status: 'FAILED' },
        });
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          total: c._count.recipients,
          sent,
          failed,
          deliveryRate:
            c._count.recipients > 0
              ? `${((sent / c._count.recipients) * 100).toFixed(1)}%`
              : '0%',
        };
      })
    );

    // Totais gerais
    const [totalFollowupSent, totalCampaignSent, totalLeads] = await Promise.all([
      prisma.followUpMessage.count({ where: { status: 'SENT' } }),
      prisma.campaignRecipient.count({ where: { status: 'SENT' } }),
      prisma.lead.count(),
    ]);

    res.json({
      timeline: days,
      totals: {
        followupSent: totalFollowupSent,
        campaignSent: totalCampaignSent,
        totalLeads,
        responseRate:
          totalLeads > 0
            ? `${((followupResponded / totalLeads) * 100).toFixed(1)}%`
            : '0%',
      },
      funnel: {
        active: followupActive,
        responded: followupResponded,
        completed: followupCompleted,
        paused: followupPaused,
      },
      followupByStatus: followupByStatus.map((f) => ({ status: f.status, count: f._count })),
      campaignRecipientByStatus: campaignRecipientByStatus.map((c) => ({
        status: c.status,
        count: c._count,
      })),
      campaignsByStatus: campaignsByStatus.map((c) => ({ status: c.status, count: c._count })),
      topCampaigns: topCampaignsWithMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
