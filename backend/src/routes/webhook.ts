import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { followUpQueue } from '../workers/followup-worker';

const router = Router();

// Endpoint para receber webhooks do Chatwoot
router.post('/chatwoot', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;

    // Verificar se é uma mensagem criada por um contato (incoming)
    if (
      event.event === 'message_created' &&
      event.message_type === 'incoming'
    ) {
      const sender = event.sender;
      
      if (sender && sender.id) {
        const chatwootContactId = sender.id;

        // Buscar lead correspondente no nosso banco
        const lead = await prisma.lead.findFirst({
          where: { chatwootContactId },
        });

        if (lead) {
          // Registrar último contato e Pausar o Follow-up se estiver Ativo
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              lastResponseAt: new Date(),
              followUpStatus: lead.followUpStatus === 'ACTIVE' ? 'PAUSED' : lead.followUpStatus
            },
          });

          if (lead.followUpStatus === 'ACTIVE') {
            console.log(`⏸️ O Lead ${lead.name || lead.phone} respondeu! Follow-up pausado automaticamente.`);
            
            // Remover eventuais jobs pendentes/agendados deste lead da fila do BullMQ
            // O ID do job segue o padrão followup-[leadId]-[attempt]
            // Como não sabemos qual a tentativa exata que está lá, podemos tentar buscar todas ou usar uma feature do BullMQ para remover por padrão.
            // Para simplificar, o Worker já verifica `if (lead.followUpStatus !== 'ACTIVE')` e cancela o disparo na hora que rodar.
            // Então apenas mudar o status já garante que ele não vai receber a próxima mensagem, mas vamos tentar limpar a fila tbm.
            try {
              const jobs = await followUpQueue.getDelayed();
              for (const job of jobs) {
                if (job.data && job.data.leadId === lead.id) {
                  await job.remove();
                  console.log(`🗑️ Job pendente ${job.id} removido da fila.`);
                }
              }
            } catch (queueErr) {
              console.error('Erro ao tentar limpar jobs pendentes da fila:', queueErr);
            }
          }
        }
      }
    }

    // Sempre responder 200 OK para o webhook não ficar tentando reenviar
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no Webhook do Chatwoot:', error);
    res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
});

export default router;
