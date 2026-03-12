import { Router, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/settings
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    // Remove tokens sensíveis para viewer
    if (req.user?.role === 'VIEWER') {
      res.json({
        settings: {
          ...settings,
          chatwootApiToken: settings.chatwootApiToken ? '••••••••' : null,
          chatwootBotToken: settings.chatwootBotToken ? '••••••••' : null,
          wuzapiToken: settings.wuzapiToken ? '••••••••' : null,
        },
      });
      return;
    }

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

const settingsSchema = z.object({
  chatwootUrl: z.string().url().optional().nullable(),
  chatwootApiToken: z.string().optional().nullable(),
  chatwootBotToken: z.string().optional().nullable(),
  chatwootAccountId: z.string().optional().nullable(),
  wuzapiEndpoint: z.string().url().optional().nullable(),
  wuzapiToken: z.string().optional().nullable(),
  wuzapiInstanceId: z.string().optional().nullable(),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingDays: z.array(z.number().min(0).max(6)).optional(),
  defaultFollowUpIntervalDays: z.number().min(1).max(30).optional(),
  maxFollowUpAttempts: z.number().min(1).max(20).optional(),
});

// PUT /api/settings
router.put(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = settingsSchema.parse(req.body);

      let settings = await prisma.settings.findFirst();

      if (!settings) {
        settings = await prisma.settings.create({ data: data as any });
      } else {
        // Não sobrescreve token se vier mascarado
        const updateData: any = { ...data };
        if (updateData.chatwootApiToken === '••••••••') delete updateData.chatwootApiToken;
        if (updateData.chatwootBotToken === '••••••••') delete updateData.chatwootBotToken;
        if (updateData.wuzapiToken === '••••••••') delete updateData.wuzapiToken;

        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: updateData,
        });
      }

      res.json({ settings, message: 'Configurações salvas com sucesso' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  }
);

// POST /api/settings/test-chatwoot
router.post(
  '/test-chatwoot',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const settings = await prisma.settings.findFirst();
      if (!settings?.chatwootUrl || !settings?.chatwootApiToken) {
        res.status(400).json({ error: 'Configure URL e Token do Chatwoot primeiro' });
        return;
      }

      const response = await axios.get(
        `${settings.chatwootUrl}/api/v1/accounts/${settings.chatwootAccountId}/contacts?page=1`,
        {
          headers: { api_access_token: settings.chatwootApiToken },
          timeout: 10000,
        }
      );

      res.json({
        success: true,
        message: 'Conexão com Chatwoot estabelecida com sucesso',
        contactsCount: response.data?.meta?.all_count || 0,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `Falha na conexão com Chatwoot: ${error.response?.status || error.message}`,
      });
    }
  }
);

// POST /api/settings/test-wuzapi
router.post(
  '/test-wuzapi',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const settings = await prisma.settings.findFirst();
      if (!settings?.wuzapiEndpoint || !settings?.wuzapiToken) {
        res.status(400).json({ error: 'Configure Endpoint e Token do WuzAPI primeiro' });
        return;
      }

      const endpoint = settings.wuzapiEndpoint.replace(/\/$/, '');
      const response = await axios.get(`${endpoint}/session/status`, {
        headers: { Token: settings.wuzapiToken },
        timeout: 10000,
      });

      res.json({
        success: true,
        message: 'Conexão com WuzAPI estabelecida com sucesso',
        status: response.data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `Falha na conexão com WuzAPI: ${error.response?.status || error.message}`,
      });
    }
  }
);

export default router;
