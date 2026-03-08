import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      activeLeads,
      totalLeads,
      respondedLeads,
      messagesToday,
      messagesWeek,
      activeCampaigns,
      totalCampaigns,
      campaignRecipientsSent,
      campaignRecipientsTotal,
      pendingScheduled,
      recentFollowups,
      recentCampaigns,
    ] = await Promise.all([
      prisma.lead.count({ where: { followUpStatus: 'ACTIVE' } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { followUpStatus: 'RESPONDED' } }),
      prisma.followUpMessage.count({
        where: { sentAt: { gte: today } },
      }),
      prisma.followUpMessage.count({
        where: { sentAt: { gte: weekAgo } },
      }),
      prisma.campaign.count({ where: { status: { in: ['RUNNING', 'SCHEDULED'] } } }),
      prisma.campaign.count(),
      prisma.campaignRecipient.count({ where: { status: 'SENT' } }),
      prisma.campaignRecipient.count(),
      prisma.scheduledMessage.count({ where: { status: 'PENDING' } }),
      prisma.followUpMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { lead: { select: { name: true, phone: true } } },
      }),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { recipients: true } } },
      }),
    ]);

    res.json({
      overview: {
        leads: {
          active: activeLeads,
          total: totalLeads,
          responseRate: totalLeads > 0 ? `${((respondedLeads / totalLeads) * 100).toFixed(1)}%` : '0%',
        },
        messages: {
          today: messagesToday,
          week: messagesWeek,
        },
        campaigns: {
          active: activeCampaigns,
          total: totalCampaigns,
          deliveryRate:
            campaignRecipientsTotal > 0
              ? `${((campaignRecipientsSent / campaignRecipientsTotal) * 100).toFixed(1)}%`
              : '0%',
        },
        scheduled: pendingScheduled,
      },
      recent: {
        followups: recentFollowups,
        campaigns: recentCampaigns,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

export default router;
