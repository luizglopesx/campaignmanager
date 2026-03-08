# PRD - Follow-up & Campaign Manager
## Senhor Colchão - Integração Chatwoot + WuzAPI

**Versão:** 1.0  
**Data:** 08 de Março de 2026  
**Autor:** Senhor Colchão - Tech Team  
**Status:** Draft

---

## 1. Visão Geral do Produto

### 1.1 Objetivo

Desenvolver uma aplicação web moderna que automatize o follow-up de leads do Chatwoot e gerencie campanhas de disparo massivo via WhatsApp utilizando WuzAPI (fzap), aumentando a taxa de conversão e reduzindo trabalho manual da equipe comercial.

### 1.2 Problema

Atualmente, o processo de follow-up de leads é manual e inconsistente. Leads que entram no estágio "MEIO" do funil não recebem acompanhamento sistemático, resultando em perda de oportunidades. Além disso, não existe ferramenta integrada para campanhas de marketing via WhatsApp com carrossel de imagens.

### 1.3 Solução Proposta

Uma aplicação web full-stack que:
- Monitora automaticamente leads no Chatwoot por estágio/label
- Dispara follow-ups programados via WhatsApp através do WuzAPI
- Gerencia campanhas com carrossel de até 5 imagens
- Permite personalização, agendamento e controle total sobre as mensagens

### 1.4 Escopo

**Dentro do escopo:**
- Integração completa Chatwoot API
- Integração completa WuzAPI (fzap)
- Sistema de follow-up automático por estágio
- Editor de templates de mensagens
- Agendador de mensagens
- Gerenciador de campanhas com carrossel
- Upload e hospedagem de imagens
- Dashboard de métricas e histórico

**Fora do escopo (v1.0):**
- Integração com outras plataformas além de Chatwoot
- Análise avançada com BI/relatórios complexos
- CRM completo (foco em follow-up e campanhas)
- Chatbot ou IA conversacional

---

## 2. Personas e Stakeholders

### 2.1 Usuário Principal

**Perfil:** Gerente Comercial / Dono da Empresa
- Precisa aumentar conversão de leads
- Quer automatizar processos repetitivos
- Necessita visibilidade sobre campanhas ativas
- Valoriza interface simples e funcional

### 2.2 Stakeholders

- Equipe de Vendas (usuários secundários)
- Clientes/Leads (receptores das mensagens)
- Administrador de TI (configuração e manutenção)

---

## 3. Requisitos Funcionais

### 3.1 Módulo de Autenticação

**RF-001:** Sistema de login com email e senha  
**RF-002:** Gerenciamento de usuários (admin pode criar/editar/deletar)  
**RF-003:** Níveis de permissão (Admin, Operador, Visualizador)  
**RF-004:** Recuperação de senha via email

### 3.2 Módulo de Configurações

**RF-005:** Configurar credenciais do Chatwoot (URL, API Token)  
**RF-006:** Configurar credenciais do WuzAPI (Endpoint, Token, Instance ID)  
**RF-007:** Testar conexão com ambas APIs antes de salvar  
**RF-008:** Configurar horário de funcionamento (ex: 08h-18h, seg-sex)  
**RF-009:** Configurar intervalo padrão entre disparos (dias)

### 3.3 Módulo de Follow-up Automático

**RF-010:** Monitorar continuamente leads no Chatwoot filtrados por label/stage "MEIO"  
**RF-011:** Iniciar ciclo de follow-up automaticamente quando lead entra no estágio  
**RF-012:** Disparar primeira mensagem imediatamente ou no dia seguinte (configurável)  
**RF-013:** Detectar resposta do lead via webhook do Chatwoot  
**RF-014:** Pausar follow-up automaticamente quando lead responder  
**RF-015:** Retomar follow-up se lead parar de responder após X horas (configurável)  
**RF-016:** Disparar mensagem a cada 1 dia (configurável) se não houver resposta  
**RF-017:** Limitar número máximo de tentativas (configurável, padrão: 5)  
**RF-018:** Marcar lead como "follow-up concluído" após máximo de tentativas  
**RF-019:** Registrar todas tentativas em banco de dados com timestamps  
**RF-020:** Respeitar horário de funcionamento configurado

### 3.4 Módulo de Templates de Mensagens

**RF-021:** Criar template de mensagem de follow-up  
**RF-022:** Suporte a variáveis dinâmicas: `{{nome}}`, `{{produto}}`, `{{vendedor}}`, `{{empresa}}`  
**RF-023:** Editar templates existentes  
**RF-024:** Duplicar templates  
**RF-025:** Deletar templates (com confirmação)  
**RF-026:** Criar múltiplos templates para diferentes estágios/campanhas  
**RF-027:** Definir qual template usar para cada tipo de follow-up  
**RF-028:** Preview da mensagem com variáveis substituídas

### 3.5 Módulo de Agendamento

**RF-029:** Interface de calendário para visualizar mensagens agendadas  
**RF-030:** Agendar mensagem única para data/hora específica  
**RF-031:** Agendar mensagem em lote para lista de contatos  
**RF-032:** Editar agendamento antes do envio  
**RF-033:** Cancelar agendamento  
**RF-034:** Visualizar fila de mensagens (pendente, processando, enviado, falhou)  
**RF-035:** Reprocessar mensagens que falharam  
**RF-036:** Notificação quando agendamento for enviado

### 3.6 Módulo de Campanhas

**RF-037:** Criar nova campanha com nome, descrição e período  
**RF-038:** Editor de carrossel de imagens (até 5 imagens)  
**RF-039:** Upload de imagem via interface  
**RF-040:** Gerar URL pública automaticamente para cada imagem  
**RF-041:** Adicionar legenda personalizada para cada imagem  
**RF-042:** Reordenar imagens no carrossel (drag & drop)  
**RF-043:** Preview do carrossel antes de enviar  
**RF-044:** Remover imagem do carrossel  
**RF-045:** Opção 1: importar números manualmente (CSV ou texto)  
**RF-046:** Opção 2: buscar contatos do Chatwoot com filtros (label, inbox, data)  
**RF-047:** Preview da lista de destinatários antes do envio  
**RF-048:** Remover números específicos da lista antes do envio  
**RF-049:** Validar formato dos números (E.164)  
**RF-050:** Disparo imediato ou agendado da campanha  
**RF-051:** Enviar imagens em sequência via WuzAPI  
**RF-052:** Controlar velocidade de disparo (throttling) para evitar bloqueio  
**RF-053:** Dashboard da campanha com métricas (enviados, entregues, visualizados, respondidos)  
**RF-054:** Pausar campanha em andamento  
**RF-055:** Duplicar campanha existente  
**RF-056:** Arquivar campanhas concluídas

### 3.7 Módulo de Histórico e Logs

**RF-057:** Visualizar histórico de todas mensagens enviadas  
**RF-058:** Filtrar por contato, data, campanha, tipo  
**RF-059:** Visualizar detalhes de cada disparo (status, horário, resposta)  
**RF-060:** Exportar logs em CSV  
**RF-061:** Logs de auditoria de ações dos usuários  
**RF-062:** Dashboard com métricas gerais (total enviado, taxa de resposta, leads convertidos)

### 3.8 Módulo de Integrações

**RF-063:** Sincronizar contatos do Chatwoot periodicamente  
**RF-064:** Sincronizar labels/tags do Chatwoot  
**RF-065:** Webhook para receber eventos do Chatwoot (nova mensagem, mudança de status)  
**RF-066:** Atualizar status de conversa no Chatwoot via API  
**RF-067:** Enviar mensagem de texto via WuzAPI  
**RF-068:** Enviar imagem via WuzAPI  
**RF-069:** Enviar sequência de imagens (carrossel) via WuzAPI  
**RF-070:** Verificar status da instância WuzAPI (conectada/desconectada)

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance

**RNF-001:** Sistema deve suportar até 10.000 leads ativos simultaneamente  
**RNF-002:** Tempo de resposta da interface < 2 segundos  
**RNF-003:** Processamento de fila de mensagens em tempo real (< 5 segundos de latência)  
**RNF-004:** Upload de imagens até 5MB cada em < 10 segundos

### 4.2 Escalabilidade

**RNF-005:** Arquitetura preparada para escalar horizontalmente  
**RNF-006:** Uso de filas para processar disparos assíncronos  
**RNF-007:** Banco de dados otimizado com índices apropriados

### 4.3 Segurança

**RNF-008:** Comunicação via HTTPS obrigatório  
**RNF-009:** Senhas armazenadas com hash bcrypt  
**RNF-010:** Tokens de API criptografados no banco  
**RNF-011:** Rate limiting para prevenir abuso  
**RNF-012:** Validação de inputs em todas requisições  
**RNF-013:** Proteção contra CSRF e XSS

### 4.4 Confiabilidade

**RNF-014:** Sistema de retry automático para falhas de API  
**RNF-015:** Logs detalhados de erros para debug  
**RNF-016:** Backup automático do banco de dados diariamente  
**RNF-017:** Uptime de 99% (objetivo)

### 4.5 Usabilidade

**RNF-018:** Interface em português brasileiro  
**RNF-019:** Design responsivo (desktop, tablet, mobile)  
**RNF-020:** Feedback visual claro para todas ações do usuário  
**RNF-021:** Mensagens de erro compreensíveis  
**RNF-022:** Documentação de usuário acessível no sistema

### 4.6 Manutenibilidade

**RNF-023:** Código versionado em Git  
**RNF-024:** Testes unitários para funções críticas  
**RNF-025:** Deploy via Docker/Portainer  
**RNF-026:** Variáveis de ambiente para configurações sensíveis  
**RNF-027:** Logs estruturados em formato JSON

---

## 5. Arquitetura Técnica

### 5.1 Stack Tecnológica

**Frontend:**
- React 18+
- Tailwind CSS
- ShadCN UI Components
- Axios (HTTP client)
- React Query (state management)
- React Router (navegação)

**Backend:**
- Node.js + Express ou Python + FastAPI
- TypeScript (preferencial para Node.js)
- BullMQ (filas de processamento)
- Redis (cache e filas)
- JWT (autenticação)

**Banco de Dados:**
- PostgreSQL 15+
- Prisma ORM (Node.js) ou SQLAlchemy (Python)

**Armazenamento:**
- MinIO ou AWS S3 (imagens)

**Deploy:**
- Docker + Docker Compose
- Portainer (gerenciamento)
- Nginx (reverse proxy)

### 5.2 Arquitetura de Componentes

```
┌─────────────────────────────────────────────┐
│           Frontend (React SPA)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │Campanhas │ │Follow-up │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────┬───────────────────────────┘
                  │ HTTPS/REST API
┌─────────────────▼───────────────────────────┐
│           Backend API (Express)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Auth      │ │Campaigns │ │Follow-up │   │
│  │Service   │ │Service   │ │Service   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
┌───────▼──┐ ┌────▼────┐ ┌─▼────────┐
│PostgreSQL│ │ Redis   │ │ MinIO/S3 │
│          │ │ BullMQ  │ │ (Images) │
└──────────┘ └─────────┘ └──────────┘
        │         │
        └─────────┼─────────────────────┐
                  │                     │
         ┌────────▼────────┐   ┌────────▼────────┐
         │  Chatwoot API   │   │   WuzAPI (fzap) │
         │  (REST)         │   │   (WhatsApp)    │
         └─────────────────┘   └─────────────────┘
```

### 5.3 Fluxo de Dados - Follow-up Automático

1. **Polling Service** consulta Chatwoot API a cada 5 minutos
2. Identifica leads no estágio "MEIO"
3. Para cada lead novo, cria registro no banco com status "pending"
4. **Follow-up Worker** (BullMQ) processa fila:
   - Verifica se está dentro do horário permitido
   - Substitui variáveis no template
   - Envia mensagem via WuzAPI
   - Atualiza status para "sent" + timestamp
5. **Webhook Handler** recebe eventos do Chatwoot:
   - Se lead responder, atualiza status para "responded" e pausa ciclo
6. **Scheduler** verifica diariamente leads sem resposta e cria nova job

### 5.4 Fluxo de Dados - Campanha

1. Usuário cria campanha e faz upload de imagens
2. Imagens são salvas no MinIO/S3 e URLs são geradas
3. Usuário seleciona destinatários (manual ou Chatwoot)
4. Sistema valida números e cria jobs na fila
5. **Campaign Worker** processa cada destinatário:
   - Envia imagens em sequência via WuzAPI
   - Aguarda 2-3s entre cada imagem
   - Registra status de cada envio
6. Dashboard atualiza métricas em tempo real

---

## 6. Modelo de Dados

### 6.1 Entidades Principais

**Users**
```
id: UUID (PK)
email: String (unique)
password_hash: String
name: String
role: Enum (admin, operator, viewer)
created_at: Timestamp
```

**Settings**
```
id: UUID (PK)
chatwoot_url: String
chatwoot_api_token: String (encrypted)
wuzapi_endpoint: String
wuzapi_token: String (encrypted)
wuzapi_instance_id: String
working_hours_start: Time
working_hours_end: Time
working_days: JSON (array de dias da semana)
default_follow_up_interval_days: Integer
max_follow_up_attempts: Integer
```

**Message_Templates**
```
id: UUID (PK)
name: String
content: Text
variables: JSON (array de variáveis disponíveis)
type: Enum (follow_up, campaign)
created_by: UUID (FK Users)
created_at: Timestamp
updated_at: Timestamp
```

**Leads**
```
id: UUID (PK)
chatwoot_contact_id: Integer
name: String
phone: String
current_stage: String
follow_up_status: Enum (active, paused, completed, responded)
follow_up_attempts: Integer
last_message_sent_at: Timestamp
last_response_at: Timestamp
created_at: Timestamp
updated_at: Timestamp
```

**Follow_Up_Messages**
```
id: UUID (PK)
lead_id: UUID (FK Leads)
template_id: UUID (FK Message_Templates)
message_content: Text
status: Enum (pending, sent, delivered, read, failed)
sent_at: Timestamp
response_received_at: Timestamp
wuzapi_message_id: String
error_message: Text
attempt_number: Integer
```

**Campaigns**
```
id: UUID (PK)
name: String
description: Text
status: Enum (draft, scheduled, running, paused, completed)
start_date: Timestamp
end_date: Timestamp
created_by: UUID (FK Users)
created_at: Timestamp
updated_at: Timestamp
```

**Campaign_Images**
```
id: UUID (PK)
campaign_id: UUID (FK Campaigns)
image_url: String
caption: Text
order: Integer
```

**Campaign_Recipients**
```
id: UUID (PK)
campaign_id: UUID (FK Campaigns)
phone: String
name: String
status: Enum (pending, sent, delivered, failed)
sent_at: Timestamp
wuzapi_message_id: String
error_message: Text
```

**Scheduled_Messages**
```
id: UUID (PK)
recipient_phone: String
recipient_name: String
message_content: Text
scheduled_for: Timestamp
status: Enum (pending, sent, cancelled, failed)
campaign_id: UUID (FK Campaigns, nullable)
created_by: UUID (FK Users)
```

**Audit_Logs**
```
id: UUID (PK)
user_id: UUID (FK Users)
action: String
entity_type: String
entity_id: UUID
details: JSON
ip_address: String
created_at: Timestamp
```

---

## 7. Integrações Externas

### 7.1 Chatwoot API

**Documentação:** https://www.chatwoot.com/developers/api/

**Endpoints utilizados:**

- `GET /api/v1/accounts/{account_id}/contacts` - Listar contatos
- `GET /api/v1/accounts/{account_id}/contacts/{id}` - Detalhes do contato
- `GET /api/v1/accounts/{account_id}/conversations` - Listar conversas
- `GET /api/v1/accounts/{account_id}/conversations/{id}` - Detalhes da conversa
- `POST /api/v1/accounts/{account_id}/conversations/{id}/messages` - Enviar mensagem
- `GET /api/v1/accounts/{account_id}/labels` - Listar labels
- Webhooks configurados para receber eventos de nova mensagem

**Autenticação:** Bearer Token via header `api_access_token`

### 7.2 WuzAPI (fzap)

**Documentação:** [Documentação fornecida pelo usuário]

**Endpoints utilizados:**

- Enviar mensagem de texto
- Enviar imagem com legenda
- Verificar status da conexão/instância
- Obter informações do número

**Autenticação:** Token via header ou query parameter (conforme documentação)

**Throttling:** Respeitar limite de mensagens por minuto para evitar bloqueio do WhatsApp

---

## 8. Interface do Usuário (UI/UX)

### 8.1 Navegação Principal

**Menu Lateral:**
- 📊 Dashboard
- 📞 Follow-up
- 📢 Campanhas
- 📅 Agendamentos
- 📝 Templates
- 👥 Contatos
- ⚙️ Configurações
- 👤 Meu Perfil

### 8.2 Telas Principais

**Dashboard**
- Cards com métricas principais (leads ativos, mensagens enviadas hoje, taxa de resposta)
- Gráfico de follow-ups nos últimos 7 dias
- Gráfico de campanhas ativas
- Lista de próximas mensagens agendadas
- Alertas (erros de API, instância WuzAPI desconectada)

**Follow-up**
- Tabela de leads em follow-up com colunas: Nome, Telefone, Estágio, Tentativas, Última Mensagem, Status
- Filtros por status, estágio, data
- Ações: Ver histórico, Pausar, Retomar, Finalizar
- Botão para criar follow-up manual

**Campanhas**
- Lista de campanhas (cards) com preview da primeira imagem
- Status visual (draft, agendada, em andamento, concluída)
- Métricas da campanha (enviados/total, taxa de visualização)
- Botão "+ Nova Campanha"
- Ao clicar, abre wizard com etapas:
  1. Informações básicas
  2. Editor de carrossel
  3. Seleção de destinatários
  4. Review e agendamento

**Editor de Carrossel**
- Área de drop para upload de imagens
- Grid com preview das imagens (drag & drop para reordenar)
- Campo de legenda abaixo de cada imagem
- Botão de remover imagem
- Preview do carrossel em modo simulado (WhatsApp-like)

**Templates**
- Lista de templates com nome, tipo, prévia
- Botão "+ Novo Template"
- Editor de template com:
  - Campo de nome
  - Textarea para conteúdo
  - Botões para inserir variáveis
  - Preview com variáveis substituídas por exemplos

**Configurações**
- Abas: Integrações, Horário de Funcionamento, Follow-up, Usuários
- Formulários com campos apropriados
- Botão "Testar Conexão" para Chatwoot e WuzAPI

### 8.3 Design System

**Paleta de cores:**
- Primary: Teal (#21808D) - seguindo design system Perplexity
- Success: Green
- Warning: Orange
- Error: Red
- Background: Cream (#FCFCF9) light mode / Charcoal (#1F2121) dark mode
- Text: Slate (#13343B) light mode / Gray (#F5F5F5) dark mode

**Componentes:**
- Usar ShadCN UI components
- Botões com estados claros (hover, active, disabled)
- Inputs com validação visual
- Modais para confirmações importantes
- Toast notifications para feedback de ações
- Skeleton loaders para estados de carregamento

---

## 9. Cronograma e Fases

### Fase 1 - MVP (4-6 semanas)

**Sprint 1 (2 semanas):**
- Setup do projeto (frontend + backend)
- Autenticação e gerenciamento de usuários
- Módulo de configurações
- Integração básica com Chatwoot API
- Integração básica com WuzAPI

**Sprint 2 (2 semanas):**
- Módulo de follow-up automático (core logic)
- Sistema de filas (BullMQ)
- Webhook handler do Chatwoot
- Módulo de templates de mensagens
- Interface de follow-up

**Sprint 3 (2 semanas):**
- Módulo de campanhas (criação e disparo)
- Upload e gerenciamento de imagens
- Editor de carrossel
- Seleção de destinatários
- Dashboard básico

### Fase 2 - Melhorias (2-3 semanas)

- Módulo de agendamento avançado
- Histórico e logs detalhados
- Métricas e relatórios
- Filtros avançados no Chatwoot
- Otimizações de performance

### Fase 3 - Polimento (1-2 semanas)

- Testes end-to-end
- Ajustes de UX baseados em feedback
- Documentação completa
- Deploy em produção
- Treinamento de usuários

---

## 10. Métricas de Sucesso

### 10.1 KPIs do Produto

- **Taxa de resposta de follow-ups:** > 25%
- **Leads convertidos por follow-up automático:** > 10% dos leads em follow-up
- **Tempo economizado pela equipe comercial:** > 5 horas/semana
- **Taxa de entrega de campanhas:** > 95%
- **Uptime do sistema:** > 99%

### 10.2 Métricas de Uso

- Número de follow-ups ativos
- Número de campanhas criadas por mês
- Total de mensagens enviadas por dia
- Taxa de clique em campanhas (se rastreável)
- Número de usuários ativos mensalmente

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Bloqueio do WhatsApp por disparo massivo | Média | Alto | Implementar throttling rigoroso, respeitar limites do WuzAPI, permitir configuração de velocidade |
| Instabilidade da API do Chatwoot | Média | Médio | Implementar retry logic, cache de dados, fallback manual |
| Falha na integração WuzAPI | Alta | Alto | Testes extensivos, ambiente de sandbox, validação de payloads |
| Sobrecarga do servidor com muitas campanhas simultâneas | Baixa | Médio | Uso de filas, limitação de campanhas ativas simultâneas |
| Dados sensíveis expostos (tokens, senhas) | Baixa | Alto | Criptografia de dados sensíveis, HTTPS obrigatório, auditoria de segurança |
| Upload de imagens muito grandes causando lentidão | Média | Baixo | Validação de tamanho/formato, compressão automática, CDN para servir imagens |

---

## 12. Dependências e Pré-requisitos

### 12.1 Dependências Externas

- Conta ativa no Chatwoot com API habilitada
- Instância do WuzAPI (fzap) configurada e conectada ao WhatsApp
- Servidor com Docker e Portainer
- Banco PostgreSQL 15+
- Redis 7+
- MinIO ou S3 para armazenamento de imagens

### 12.2 Recursos Necessários

**Equipe:**
- 1 Desenvolvedor Full-stack (React + Node.js)
- 1 Desenvolvedor Backend (APIs e integrações)
- 0.5 Designer UI/UX (meio período)
- 0.5 QA / Tester (meio período)

**Infraestrutura:**
- Servidor VPS: 4 vCPU, 8GB RAM, 100GB SSD (mínimo)
- Domínio e certificado SSL
- Backup storage

---

## 13. Documentação e Suporte

### 13.1 Documentação Técnica

- README com instruções de setup
- Documentação da API (OpenAPI/Swagger)
- Diagramas de arquitetura
- Guia de deploy

### 13.2 Documentação de Usuário

- Manual do usuário (formato web)
- Vídeo-tutoriais para funcionalidades principais
- FAQ
- Guia de troubleshooting

### 13.3 Suporte

- Canal de suporte via email ou ticket
- Grupo no WhatsApp/Telegram para dúvidas
- Atualizações periódicas do sistema

---

## 14. Próximos Passos

1. ✅ **Aprovação deste PRD** pelos stakeholders
2. ⏳ **Setup do ambiente de desenvolvimento** (repositório Git, CI/CD)
3. ⏳ **Design das telas principais** (Figma ou similar)
4. ⏳ **Início do Sprint 1** conforme cronograma
5. ⏳ **Reuniões semanais de acompanhamento**

---

## 15. Aprovações

| Nome | Cargo | Data | Assinatura |
|------|-------|------|------------|
| | Product Owner | | |
| | Tech Lead | | |
| | Stakeholder Comercial | | |

---

## 16. Histórico de Revisões

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 08/03/2026 | Senhor Colchão Tech | Versão inicial do PRD |

---

**Contato:**  
Para dúvidas ou sugestões sobre este PRD, entre em contato com a equipe de produto.

---

## Anexos

### Anexo A - Referências de Documentação

- Chatwoot API Documentation: https://www.chatwoot.com/developers/api/
- WuzAPI (fzap) Documentation: [fornecer link ou documento]
- BullMQ Documentation: https://docs.bullmq.io/
- ShadCN UI: https://ui.shadcn.com/

### Anexo B - Wireframes

[Incluir wireframes das telas principais quando disponíveis]

### Anexo C - Fluxogramas Detalhados

[Incluir fluxogramas dos processos de follow-up e campanha quando disponíveis]
