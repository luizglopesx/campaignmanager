import axios from 'axios';
import prisma from '../config/database';

interface WuzAPIConfig {
  endpoint: string;
  token: string;
  instanceId: string;
}

async function getConfig(): Promise<WuzAPIConfig> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.wuzapiEndpoint || !settings?.wuzapiToken) {
    throw new Error('WuzAPI não configurado. Vá em Configurações para definir endpoint e token.');
  }
  return {
    endpoint: settings.wuzapiEndpoint.replace(/\/$/, ''),
    token: settings.wuzapiToken,
    instanceId: settings.wuzapiInstanceId || 'default',
  };
}

function createClient(cfg: WuzAPIConfig) {
  return axios.create({
    baseURL: cfg.endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Token': cfg.token,
    },
    timeout: 30000,
  });
}

/**
 * Formata número de telefone para padrão WuzAPI (com @s.whatsapp.net)
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // Se já tem o sufixo, retorna direto
  if (cleaned.includes('@')) return cleaned;
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Verifica status da instância WuzAPI
 */
export async function checkStatus(): Promise<{ connected: boolean; info: any }> {
  const cfg = await getConfig();
  const client = createClient(cfg);
  try {
    const res = await client.get('/session/status');
    return {
      connected: res.data?.Connected === true,
      info: res.data,
    };
  } catch (error: any) {
    console.error('WuzAPI status error:', error.message);
    return { connected: false, info: null };
  }
}

/**
 * Envia mensagem de texto via WhatsApp
 */
export async function sendText(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  try {
    const res = await client.post('/chat/send/text', {
      Phone: formatPhone(phone),
      Body: message,
    });

    return {
      success: true,
      messageId: res.data?.MessageID || res.data?.Id,
    };
  } catch (error: any) {
    console.error('WuzAPI sendText error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Envia imagem via WhatsApp
 */
export async function sendImage(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  try {
    const res = await client.post('/chat/send/image', {
      Phone: formatPhone(phone),
      Image: imageUrl,
      Caption: caption || '',
    });

    return {
      success: true,
      messageId: res.data?.MessageID || res.data?.Id,
    };
  } catch (error: any) {
    console.error('WuzAPI sendImage error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Envia múltiplas imagens em sequência (simulando carrossel)
 */
export async function sendCarousel(
  phone: string,
  images: { url: string; caption?: string }[],
  delayMs: number = 1500
): Promise<{ success: boolean; results: any[]; error?: string }> {
  const results: any[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const result = await sendImage(phone, img.url, img.caption);
    results.push(result);

    if (!result.success) {
      return { success: false, results, error: `Falha ao enviar imagem ${i + 1}: ${result.error}` };
    }

    // Delay entre envios para não sobrecarregar
    if (i < images.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { success: true, results };
}

/**
 * Envia documento via WhatsApp
 */
export async function sendDocument(
  phone: string,
  documentUrl: string,
  filename: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  try {
    const res = await client.post('/chat/send/document', {
      Phone: formatPhone(phone),
      Document: documentUrl,
      FileName: filename,
    });

    return {
      success: true,
      messageId: res.data?.MessageID || res.data?.Id,
    };
  } catch (error: any) {
    console.error('WuzAPI sendDocument error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Verifica se um número existe no WhatsApp
 */
export async function checkNumber(phone: string): Promise<{ exists: boolean; jid?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  try {
    const res = await client.post('/user/check', {
      Phone: [formatPhone(phone)],
    });

    const users = res.data?.Users || [];
    if (users.length > 0 && users[0].IsInWhatsApp) {
      return { exists: true, jid: users[0].JID };
    }
    return { exists: false };
  } catch (error: any) {
    console.error('WuzAPI checkNumber error:', error.message);
    return { exists: false };
  }
}

/**
 * Posta uma imagem/vídeo no Status do WhatsApp via endpoints dedicados do Fzap
 */
export async function sendStatus(
  mediaUrl: string,
  caption?: string,
  mediaType?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = await getConfig();
  const client = createClient(cfg);

  try {
    let res;

    if (mediaType === 'video') {
      res = await client.post('/status/send-video', {
        Video: mediaUrl,
        Caption: caption || '',
      });
    } else {
      res = await client.post('/status/send-image', {
        Image: mediaUrl,
        Caption: caption || '',
      });
    }

    return {
      success: true,
      messageId: res.data?.MessageID || res.data?.Id,
    };
  } catch (error: any) {
    console.error('WuzAPI sendStatus error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

export const wuzapiService = {
  checkStatus,
  sendText,
  sendImage,
  sendCarousel,
  sendDocument,
  checkNumber,
  sendStatus,
};
