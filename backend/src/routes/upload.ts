import { Router, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configuração do Multer (memória, limite 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem inválido. Use JPEG, PNG, WebP ou GIF'));
    }
  },
});

// Supabase Client
const getSupabaseClient = () => {
  return createClient(config.supabase.url, config.supabase.serviceKey);
};

// POST /api/upload/image
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhuma imagem enviada' });
        return;
      }

      if (!config.supabase.url || !config.supabase.serviceKey) {
        res.status(500).json({ error: 'Supabase Storage não configurado' });
        return;
      }

      const supabase = getSupabaseClient();

      // Gera nome único para o arquivo
      const ext = req.file.originalname.split('.').pop();
      const fileName = `campaigns/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(config.supabase.storageBucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        res.status(500).json({ error: `Erro no upload: ${error.message}` });
        return;
      }

      // Gera URL pública
      const { data: urlData } = supabase.storage
        .from(config.supabase.storageBucket)
        .getPublicUrl(fileName);

      res.json({
        url: urlData.publicUrl,
        path: data.path,
        message: 'Imagem enviada com sucesso',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro no upload da imagem' });
    }
  }
);

// DELETE /api/upload/image
router.delete('/image', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { path } = req.body;
    if (!path) {
      res.status(400).json({ error: 'Caminho da imagem é obrigatório' });
      return;
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .remove([path]);

    if (error) {
      res.status(500).json({ error: `Erro ao remover imagem: ${error.message}` });
      return;
    }

    res.json({ message: 'Imagem removida com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao remover imagem' });
  }
});

export default router;
