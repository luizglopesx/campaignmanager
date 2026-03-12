import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  variables: z.array(z.string()).optional().default([]),
  type: z.enum(['FOLLOW_UP', 'CAMPAIGN']).optional().default('FOLLOW_UP'),
  order: z.number().int().min(0).optional().default(0),
});

// GET /api/templates
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const where = type ? { type: type as any } : {};

    const templates = await prisma.messageTemplate.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await prisma.messageTemplate.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    if (!template) {
      res.status(404).json({ error: 'Template não encontrado' });
      return;
    }

    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
});

// POST /api/templates
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = templateSchema.parse(req.body);

    // Extrai variáveis automaticamente do conteudo
    const variableMatches = data.content.match(/\{\{(\w+)\}\}/g);
    const extractedVars = variableMatches
      ? [...new Set(variableMatches.map((v) => v.replace(/[{}]/g, '')))]
      : [];

    const template = await prisma.messageTemplate.create({
      data: {
        name: data.name,
        content: data.content,
        variables: extractedVars.length > 0 ? extractedVars : data.variables,
        type: data.type,
        order: data.order,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ template, message: 'Template criado com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// PUT /api/templates/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = templateSchema.partial().parse(req.body);
    const id = req.params.id as string;

    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Template não encontrado' });
      return;
    }

    // Reextrai variáveis se conteúdo mudou
    let variables = data.variables;
    if (data.content) {
      const matches = data.content.match(/\{\{(\w+)\}\}/g);
      variables = matches ? [...new Set(matches.map((v) => v.replace(/[{}]/g, '')))] : [];
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: { ...data, variables },
    });

    res.json({ template, message: 'Template atualizado com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// POST /api/templates/:id/duplicate
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const original = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!original) {
      res.status(404).json({ error: 'Template não encontrado' });
      return;
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name: `${original.name} (cópia)`,
        content: original.content,
        variables: original.variables as any,
        type: original.type,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ template, message: 'Template duplicado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao duplicar template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Template não encontrado' });
      return;
    }

    await prisma.messageTemplate.delete({ where: { id } });
    res.json({ message: 'Template removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover template' });
  }
});

// POST /api/templates/:id/preview
router.post('/:id/preview', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!template) {
      res.status(404).json({ error: 'Template não encontrado' });
      return;
    }

    const sampleVars: Record<string, string> = {
      nome: 'João Silva',
      produto: 'Colchão King Size',
      vendedor: 'Maria Santos',
      empresa: 'Senhor Colchão',
    };

    // Substitui variáveis por valores de exemplo ou recebidos
    const vars = { ...sampleVars, ...req.body.variables };
    let preview = template.content;
    Object.entries(vars).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
    });

    res.json({ preview, original: template.content });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar preview' });
  }
});

export default router;
