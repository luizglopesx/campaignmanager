import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { campaignQueue } from '../workers/campaign-worker';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// ==========================================
// SCHEMAS DE VALIDAÇÃO
// ==========================================

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED']).optional(),
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

const uploadImagesSchema = z.object({
  images: z.array(z.object({
    imageUrl: z.string().url(),
    caption: z.string().optional().nullable(),
    order: z.number().int().default(0),
  })),
});

const addRecipientsSchema = z.object({
  recipients: z.array(z.object({
    phone: z.string().min(10),
    name: z.string().optional().nullable(),
  })),
});

// ==========================================
// ROTAS
// ==========================================

// GET /api/campaigns — Listar todas as campanhas
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status && typeof status === 'string') where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          _count: {
            select: { recipients: true, images: true, scheduledMessages: true },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json({
      campaigns,
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

// GET /api/campaigns/:id - Detalhes da campanha
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        recipients: {
          take: 50,
          orderBy: { id: 'desc' }
        },
        _count: {
          select: { recipients: true, scheduledMessages: true },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns — Criar campanha (rascunho)
router.post('/', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createCampaignSchema.parse(req.body);
    const { user } = req as any;

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        status: 'DRAFT',
        createdBy: user.id,
      },
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/campaigns/:id — Atualizar campanha
router.put('/:id', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateCampaignSchema.parse(req.body);

    const campaign = await prisma.campaign.update({
      where: { id },
      data,
    });

    res.json(campaign);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/campaigns/:id — Deletar campanha
router.delete('/:id', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Verificar se não está rodando
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }

    if (campaign.status === 'RUNNING') {
      res.status(400).json({ error: 'Não é possível excluir uma campanha em execução' });
      return;
    }

    await prisma.campaign.delete({
      where: { id },
    });

    res.json({ message: 'Campanha excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/images - Atualizar imagens da campanha
router.post('/:id/images', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = uploadImagesSchema.parse(req.body);

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }

    // Deleta as anteriores (substituição completa)
    await prisma.campaignImage.deleteMany({
      where: { campaignId: id },
    });

    // Insere as novas
    if (data.images.length > 0) {
      await prisma.campaignImage.createMany({
        data: data.images.map(img => ({
          campaignId: id,
          imageUrl: img.imageUrl,
          caption: img.caption,
          order: img.order,
        })),
      });
    }

    res.json({ message: 'Imagens atualizadas com sucesso' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/recipients - Adicionar contatos na campanha
router.post('/:id/recipients', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = addRecipientsSchema.parse(req.body);

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }

    // Usa raw query ou createMany ignore duplicates
    if (data.recipients.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: data.recipients.map(r => ({
          campaignId: id,
          phone: r.phone,
          name: r.name,
          status: 'PENDING',
        })),
        skipDuplicates: true,
      });
    }

    res.json({ message: `${data.recipients.length} destinatários inseridos com sucesso.` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/start - Enviar campanha p/ worker
router.post('/:id/start', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { user } = req as any;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        recipients: { where: { status: 'PENDING' } },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }

    if (!campaign.recipients || campaign.recipients.length === 0) {
      res.status(400).json({ error: 'Campanha não possui destinatários pendentes.' });
      return;
    }

    // O worker 'campaign-worker' originalmente cuidava de mensagens agendadas.
    // Vamos enfileirar a "Mãe" campanha, e o worker desdobra para os recipients
    // ou enfileiramos cada recipient diretamente.
    // O mais seguro é enfileirar na fila de campanhas um job para cada recipient.
    
    // Atualiza status da campanha para SCHEDULED/RUNNING
    await prisma.campaign.update({
      where: { id },
      data: { status: 'SCHEDULED', startDate: new Date() },
    });

    // Enviar cada recipient para a fila de campanhas
    const jobs = campaign.recipients.map(recipient => ({
      name: 'campaign-message',
      data: {
        recipientId: recipient.id,
        campaignId: id,
        phone: recipient.phone,
        message: campaign.description || "",
      },
      opts: {
        jobId: `camp-${id}-recip-${recipient.id}`,
      }
    }));

    await campaignQueue.addBulk(jobs);

    res.json({ message: 'Campanha iniciada com sucesso, mensagens movidas para a fila.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
