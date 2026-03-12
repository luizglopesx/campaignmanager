import { Router, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import prisma from '../config/database';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { wuzapiService } from '../services/wuzapi';
import { processVideoForStatus } from '../services/video-processor';

const router = Router();

// Multer para mídia de status (vídeos até 50MB antes do processamento)
const uploadStatus = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Use JPEG, PNG, WebP, GIF, MP4, WebM, MOV ou AVI'));
    }
  },
});

const getSupabaseClient = () => {
  return createClient(config.supabase.url, config.supabase.serviceKey);
};

/**
 * POST /api/status/upload
 * Upload de mídia para Status com processamento de vídeo (max 30s, MP4, 720p)
 */
router.post(
  '/upload',
  authenticate,
  uploadStatus.single('media'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhuma mídia enviada' });
        return;
      }

      if (!config.supabase.url || !config.supabase.serviceKey) {
        res.status(500).json({ error: 'Supabase Storage não configurado' });
        return;
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      let finalBuffer = req.file.buffer;
      let finalMimetype = req.file.mimetype;
      let videoDuration: number | undefined;
      let wasProcessed = false;

      // Processamento de vídeo para Status
      if (isVideo) {
        console.log(`📹 Processando vídeo para Status: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

        const result = await processVideoForStatus(req.file.buffer);
        finalBuffer = result.buffer;
        finalMimetype = 'video/mp4';
        videoDuration = result.duration;
        wasProcessed = result.wasProcessed;

        console.log(
          wasProcessed
            ? `✅ Vídeo processado: ${videoDuration?.toFixed(1)}s, ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB`
            : `✅ Vídeo já estava no formato correto: ${videoDuration?.toFixed(1)}s`
        );
      }

      // Upload para Supabase
      const supabase = getSupabaseClient();
      const ext = isVideo ? 'mp4' : req.file.originalname.split('.').pop();
      const fileName = `status/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(config.supabase.storageBucket)
        .upload(fileName, finalBuffer, {
          contentType: finalMimetype,
          upsert: false,
        });

      if (error) {
        res.status(500).json({ error: `Erro no upload: ${error.message}` });
        return;
      }

      const { data: urlData } = supabase.storage
        .from(config.supabase.storageBucket)
        .getPublicUrl(fileName);

      res.json({
        url: urlData.publicUrl,
        path: data.path,
        mediaType: isVideo ? 'video' : 'image',
        videoDuration: videoDuration ? Math.round(videoDuration) : undefined,
        wasProcessed,
        originalSize: (req.file.size / 1024 / 1024).toFixed(1) + 'MB',
        finalSize: (finalBuffer.length / 1024 / 1024).toFixed(1) + 'MB',
        message: 'Mídia processada e enviada com sucesso',
      });
    } catch (error: any) {
      console.error('Erro no upload de status:', error);
      res.status(500).json({ error: error.message || 'Erro no processamento da mídia' });
    }
  }
);

/**
 * POST /api/status/publish
 * Publica uma mídia no Status do WhatsApp via WuzAPI (status@broadcast)
 */
router.post('/publish', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mediaUrl, caption, mediaType } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ error: 'URL da mídia é obrigatória' });
      return;
    }

    // Enviar via WuzAPI para status@broadcast
    const result = await wuzapiService.sendStatus(mediaUrl, caption, mediaType);

    if (result.success) {
      // Registrar no histórico
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'STATUS_PUBLISHED',
          entityType: 'WhatsAppStatus',
          details: {
            mediaUrl,
            caption,
            mediaType,
            messageId: result.messageId,
          } as any,
        },
      });

      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Status publicado com sucesso!',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao publicar status' });
  }
});

/**
 * GET /api/status/history
 * Histórico de status publicados
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entityType: 'WhatsAppStatus' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
  }
});

export default router;
