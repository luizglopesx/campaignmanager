import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatwootService } from '../services/chatwoot';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// GET /api/contacts - Lista de contatos
// ==========================================
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// ==========================================
// POST /api/contacts/sync-chatwoot - Sincroniza do Chatwoot
// ==========================================
router.post('/sync-chatwoot', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cwContacts = await chatwootService.getAllContacts();

    let created = 0;
    let updated = 0;

    for (const c of cwContacts) {
      const chatwootContactId = c.id;
      const phone = c.phone_number || '';
      const email = c.email || null;
      const name = c.name || 'Sem nome';
      const attributes = c.custom_attributes || {};

      if (!phone) continue; // Precisamos de telefone para os contatos no nosso sistema

      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { chatwootContactId },
            { phone },
          ],
        },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            name,
            email,
            attributes,
            chatwootContactId,
          },
        });
        updated++;
      } else {
        await prisma.lead.create({
          data: {
            chatwootContactId,
            name,
            phone,
            email,
            attributes,
            followUpStatus: 'PAUSED', // Contato puro começa pausado nas automações
          },
        });
        created++;
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CONTACTS_SYNCED_FROM_CHATWOOT',
        entityType: 'Contact',
        details: { created, updated, totalFromChatwoot: cwContacts.length } as any,
      },
    });

    res.json({
      success: true,
      message: `Sincronização concluída: ${created} novos, ${updated} atualizados.`,
      stats: { created, updated, total: cwContacts.length },
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar contatos:', error.message);
    res.status(500).json({ error: 'Erro ao sincronizar do Chatwoot', details: error.message });
  }
});

// ==========================================
// POST /api/contacts/import - Importa contatos via CSV
// ==========================================
router.post('/import', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const fileContent = req.file.buffer.toString('utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const record of records as any[]) {
      const name = record.nome || record.name || record.Nome || record.Name;
      let phone = record.telefone || record.phone || record.Telefone || record.Phone || record.whatsapp || record.Whatsapp;
      const email = record.email || record.Email || null;

      if (!phone) {
        failed++;
        continue;
      }

      // Limpar formatação de telefone
      phone = phone.replace(/\D/g, '');
      if (!name) continue;

      const existing = await prisma.lead.findFirst({
        where: { phone },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { name, email },
        });
        updated++;
      } else {
        await prisma.lead.create({
          data: {
            name,
            phone,
            email,
            followUpStatus: 'PAUSED', // Contatos iniciam fora do fluxo de disparos
          },
        });
        created++;
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CONTACTS_IMPORTED_CSV',
        entityType: 'Contact',
        details: { created, updated, failed, totalRows: records.length } as any,
      },
    });

    res.json({
      success: true,
      message: `Importação concluída: ${created} criados, ${updated} atualizados, ${failed} ignorados.`,
      stats: { created, updated, failed },
    });
  } catch (error: any) {
    console.error('Erro ao importar contatos:', error.message);
    res.status(500).json({ error: 'Erro ao processar arquivo de importação', details: error.message });
  }
});

// ==========================================
// GET /api/contacts/export - Exporta contatos para CSV
// ==========================================
router.get('/export', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contacts = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        phone: true,
        email: true,
        chatwootContactId: true,
        followUpStatus: true,
        createdAt: true,
      }
    });

    const csvData = stringify(contacts, {
      header: true,
      columns: ['name', 'phone', 'email', 'followUpStatus', 'chatwootContactId', 'createdAt']
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contatos_exportados.csv"');
    res.send(csvData);
  } catch (error: any) {
    console.error('Erro ao exportar contatos:', error.message);
    res.status(500).json({ error: 'Erro ao gerar arquivo de exportação' });
  }
});

export default router;
