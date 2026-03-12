import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional().default('OPERATOR'),
});

const updateMeSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register (admin only, exceto primeiro usuário)
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);

    // Verifica se é o primeiro usuário (setup inicial)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Se não for o primeiro usuário, exige autenticação de admin
    if (!isFirstUser) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token necessário. Apenas admins podem registrar novos usuários.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
        const adminUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!adminUser || adminUser.role !== 'ADMIN') {
          res.status(403).json({ error: 'Apenas administradores podem criar usuários' });
          return;
        }
      } catch {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: isFirstUser ? 'ADMIN' : (role as any),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Se é o primeiro usuário, cria settings padrão
    if (isFirstUser) {
      await prisma.settings.create({ data: {} });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.status(201).json({ token, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user });
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, password } = updateMeSchema.parse(req.body);
    const userId = req.user!.id;

    const data: any = {};
    if (email) {
      // Verificar se email já existe em outro usuário
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (existing) {
        res.status(409).json({ error: 'Este e-mail já está sendo usado' });
        return;
      }
      data.email = email;
    }
    if (name) data.name = name;
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// GET /api/auth/users (admin only)
router.get(
  '/users',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }
);

// DELETE /api/auth/users/:id (admin only)
router.delete(
  '/users/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (id === req.user!.id) {
        res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
        return;
      }

      await prisma.user.delete({ where: { id } });
      res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover usuário' });
    }
  }
);

export default router;
