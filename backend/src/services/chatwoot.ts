import axios from 'axios';
import prisma from '../config/database';

interface ChatwootConfig {
  baseUrl: string;
  apiToken: string;
  apiBotToken?: string;
  accountId: string;
}

async function getConfig(): Promise<ChatwootConfig> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.chatwootUrl || !settings?.chatwootApiToken) {
    throw new Error('Chatwoot API não configurado. Vá em Configurações para definir URL e token.');
  }
  return {
    baseUrl: settings.chatwootUrl.replace(/\/$/, ''),
    apiToken: settings.chatwootApiToken,
    apiBotToken: settings.chatwootBotToken || undefined,
    accountId: settings.chatwootAccountId || '1',
  };
}

function createClient(cfg: ChatwootConfig, useBotToken: boolean = false) {
  return axios.create({
    baseURL: cfg.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': useBotToken && cfg.apiBotToken ? cfg.apiBotToken : cfg.apiToken,
    },
    timeout: 15000,
  });
}

/**
 * Lista todas as labels da conta Chatwoot
 */
export async function listLabels(): Promise<{ id: number; title: string; description?: string; color?: string }[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  const res = await client.get(`/api/v1/accounts/${cfg.accountId}/labels`);
  return res.data?.payload || [];
}

/**
 * Filtra contatos por label usando o endpoint de filtro do Chatwoot
 */
export async function filterContactsByLabel(label: string): Promise<any[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  // Buscar conversas com essa label
  const allContacts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await client.get(
      `/api/v1/accounts/${cfg.accountId}/conversations`,
      { params: { labels: [label], page } }
    );

    const conversations = res.data?.data?.payload || [];
    if (conversations.length === 0) {
      hasMore = false;
      break;
    }

    for (const conv of conversations) {
      const contact = conv.meta?.sender || {};
      if (contact.id) {
        allContacts.push({
          contactId: contact.id,
          conversationId: conv.id,
          name: contact.name || 'Sem nome',
          phone: contact.phone_number || '',
          email: contact.email || '',
          thumbnail: contact.thumbnail || '',
        });
      }
    }

    // Chatwoot pagina com 25 por página tipicamente
    if (conversations.length < 25) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // Deduplicar por contactId
  const seen = new Set<number>();
  return allContacts.filter((c) => {
    if (seen.has(c.contactId)) return false;
    seen.add(c.contactId);
    return true;
  });
}

/**
 * Envia uma mensagem de texto para uma conversa via Chatwoot API
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  messageType: 'outgoing' | 'incoming' = 'outgoing'
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg, true);

  try {
    const res = await client.post(
      `/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/messages`,
      {
        content,
        message_type: messageType,
        private: false,
      }
    );

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (error: any) {
    console.error('Chatwoot sendMessage error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Envia uma mensagem com anexo (imagem/vídeo) para uma conversa via Chatwoot API
 * Usa multipart/form-data
 */
export async function sendMessageWithAttachment(
  conversationId: number,
  content: string,
  fileUrl: string,
  messageType: 'outgoing' | 'incoming' = 'outgoing'
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const cfg = await getConfig();

  try {
    // Baixar o arquivo primeiro
    const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const contentType = fileResponse.headers['content-type'] || 'application/octet-stream';

    // Determinar extensão
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    };
    const ext = extMap[contentType] || 'bin';

    // Montar FormData
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('content', content);
    form.append('message_type', messageType);
    form.append('private', 'false');
    form.append('attachments[]', Buffer.from(fileResponse.data), {
      filename: `broadcast.${ext}`,
      contentType,
    });

    const res = await axios.post(
      `${cfg.baseUrl}/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/messages`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'api_access_token': cfg.apiBotToken ? cfg.apiBotToken : cfg.apiToken,
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (error: any) {
    console.error('Chatwoot sendMessageWithAttachment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Conta total de contatos de uma label (rápido, sem carregar todos)
 */
export async function countContactsByLabel(label: string): Promise<number> {
  const contacts = await filterContactsByLabel(label);
  return contacts.length;
}

/**
 * Busca a conversa ativa de um contato
 */
export async function getConversationByContact(contactId: number): Promise<any | null> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  try {
    const res = await client.get(`/api/v1/accounts/${cfg.accountId}/contacts/${contactId}/conversations`);
    const conversations = res.data?.payload || [];
    
    // Pegar a primeira conversa não resolvida/aberta, ou a última conversa se todas estiverem fechadas
    if (conversations.length > 0) {
      const openConv = conversations.find((c: any) => c.status === 'open' || c.status === 'pending');
      return openConv || conversations[0];
    }
    return null;
  } catch (error: any) {
    console.error(`Erro ao buscar conversa do contato ${contactId}:`, error.message);
    return null;
  }
}

/**
 * Busca todos os contatos da conta Chatwoot paginados
 */
export async function getAllContacts(): Promise<any[]> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  const allContacts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await client.get(`/api/v1/accounts/${cfg.accountId}/contacts`, {
      params: { page },
    });

    const contacts = res.data?.payload || [];
    if (contacts.length === 0) {
      hasMore = false;
      break;
    }

    allContacts.push(...contacts);

    // Chatwoot Contacts endpoint tipicamente retorna 15 por página, vamos checar dados do payload
    // mas pra garantir procuramos até vir vazio. O payload do contacts no cw retorna um array.
    if (contacts.length < 15) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allContacts;
}

export const chatwootService = {
  listLabels,
  filterContactsByLabel,
  sendMessage,
  sendMessageWithAttachment,
  countContactsByLabel,
  getConversationByContact,
  getAllContacts,
};
