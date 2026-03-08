import axios from 'axios';
import prisma from '../config/database';

interface KanbanConfig {
  baseUrl: string;
  apiToken: string;
  accountId: string;
}

async function getConfig(): Promise<KanbanConfig> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.chatwootUrl || !settings?.chatwootApiToken) {
    throw new Error('Kanban API não configurado. Vá em Configurações para definir URL e token.');
  }
  return {
    baseUrl: settings.chatwootUrl.replace(/\/$/, ''),
    apiToken: settings.chatwootApiToken,
    accountId: settings.chatwootAccountId || '1',
  };
}

function createClient(cfg: KanbanConfig) {
  return axios.create({
    baseURL: cfg.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': cfg.apiToken,
    },
    timeout: 15000,
  });
}

// ==========================================
// Boards / Funis
// ==========================================

/**
 * Lista labels do Chatwoot (usadas como "boards")
 */
export async function listBoards(): Promise<any[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.get(`/api/v1/accounts/${cfg.accountId}/labels`);
  return res.data?.payload || [];
}

/**
 * Lista conversas de uma label específica (label title = boardId)
 */
export async function listCards(labelTitle: string): Promise<any[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.get(
    `/api/v1/accounts/${cfg.accountId}/conversations`,
    { params: { labels: [labelTitle], page: 1 } }
  );
  return res.data?.data?.payload || [];
}

/**
 * Busca um card por conversation ID
 */
export async function getCard(conversationId: string): Promise<any | null> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  try {
    const res = await client.get(`/kanban/cards/${conversationId}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * Busca todos os cards de um contato
 */
export async function getCardsByContact(contactId: string): Promise<any[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.get(`/kanban/cards/by-contact/${contactId}`);
  return res.data?.cards || res.data || [];
}

/**
 * Move um card para outro stage
 */
export async function moveCard(conversationId: string, stageId: string): Promise<any> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.put(`/kanban/cards/${conversationId}/move`, {
    stageId,
  });
  return res.data;
}

/**
 * Cria um novo card no Kanban
 */
export async function createCard(data: {
  boardId: string;
  stageId: string;
  contactId: string;
  title: string;
  description?: string;
}): Promise<any> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.post('/kanban/cards', data);
  return res.data;
}

/**
 * Remove um card do Kanban
 */
export async function deleteCard(conversationId: string): Promise<void> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  await client.delete(`/kanban/cards/${conversationId}`);
}

// ==========================================
// Funis customizados
// ==========================================

/**
 * Cria um novo funil
 */
export async function createFunnel(data: { name: string; description?: string }): Promise<any> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.post('/funnels', data);
  return res.data;
}

/**
 * Lista stages de um funil
 */
export async function createStage(funnelId: string, data: { name: string; order: number }): Promise<any> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.post(`/funnels/${funnelId}/stages`, data);
  return res.data;
}

// ==========================================
// Polling: busca leads novos nos boards
// ==========================================

/**
 * Sincroniza leads do Kanban para o banco local.
 * Busca todos os cards de um board e cria/atualiza leads correspondentes.
 */
export async function syncLeadsFromBoard(boardId: string, targetStageNames?: string[]): Promise<{
  created: number;
  updated: number;
  total: number;
}> {
  const cards = await listCards(boardId);
  let created = 0;
  let updated = 0;

  for (const card of cards) {
    // Se temos filtro de estágios, pular os que não estão no filtro
    if (targetStageNames && targetStageNames.length > 0) {
      const stageName = card.stage?.name || card.stageName || '';
      if (!targetStageNames.some((s) => stageName.toLowerCase().includes(s.toLowerCase()))) {
        continue;
      }
    }

    // Estrutura de conversa Chatwoot
    const contact = card.meta?.sender || card.contact || {};
    const phone = contact.phone_number || contact.phone;
    const name = contact.name || 'Sem nome';
    const contactId = contact.id || 0;
    const label = targetStageNames?.[0] || boardId;

    if (!phone) continue;

    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { chatwootContactId: Number(contactId) },
          { phone: phone },
        ],
      },
    });

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          currentStage: label,
          lastResponseAt: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.lead.create({
        data: {
          chatwootContactId: Number(contactId),
          name,
          phone,
          currentStage: label,
          followUpStatus: 'ACTIVE',
          followUpAttempts: 0,
        },
      });
      created++;
    }
  }

  console.log(`📋 Kanban sync: ${created} criados, ${updated} atualizados de ${cards.length} cards`);
  return { created, updated, total: cards.length };
}

export const kanbanService = {
  listBoards,
  listCards,
  getCard,
  getCardsByContact,
  moveCard,
  createCard,
  deleteCard,
  createFunnel,
  createStage,
  syncLeadsFromBoard,
};
