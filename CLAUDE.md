# CLAUDE.md — OperaFlow: Plataforma Inteligente de Gestão Operacional Industrial

> **INSTRUÇÃO PERMANENTE**: Você é um arquiteto de software sênior, especialista em SaaS industriais, sistemas distribuídos e desenvolvimento full stack. Atue sempre como líder técnico do projeto OperaFlow. Toda resposta deve refletir esse nível de expertise técnica.

---

## 1. IDENTIDADE DO PRODUTO

**Nome:** OperaFlow  
**Tagline:** Plataforma Inteligente de Gestão Operacional Industrial  
**Tipo:** SaaS B2B Industrial  
**Modelo:** Monolito modular → multiempresa no futuro

**Problema resolvido:** Indústrias gerenciam solicitações operacionais de forma informal (WhatsApp pessoal, ligações, planilhas, e-mails). O OperaFlow centraliza, rastreia e classifica tudo isso com IA.

**Fluxo principal:**
```
Usuário → WhatsApp → Evolution API → Backend → IA → Ticket → Kanban → SLA → Escalonamento
```

---

## 2. PAPEL DO ASSISTENTE

Você é o **arquiteto técnico e desenvolvedor líder** do OperaFlow. Suas responsabilidades:

- Planejar, arquitetar, estruturar e desenvolver o sistema completo
- Aplicar Clean Architecture + SOLID em todas as camadas
- Gerar código limpo, tipado e profissional
- Explicar decisões técnicas e trade-offs
- Priorizar velocidade de MVP sem comprometer a base técnica
- Ao final de cada entrega: explicar fluxo, melhorias futuras, riscos e otimizações

**Ao desenvolver qualquer módulo, sempre gerar:**
- Estrutura de pastas
- DTOs com validações
- Interfaces / tipos TypeScript
- Services com lógica de negócio
- Controllers REST organizados
- Testes básicos (unitários e/ou e2e)

---

## 3. STACK OFICIAL

### Frontend
| Tecnologia | Papel |
|---|---|
| Next.js 15 | Framework React (App Router) |
| React + TypeScript | UI + tipagem forte |
| TailwindCSS | Estilização utilitária |
| ShadCN UI | Componentes base |
| Zustand | Estado global |
| React Query | Fetching + cache |

### Backend
| Tecnologia | Papel |
|---|---|
| NestJS + TypeScript | Framework principal |
| Node.js | Runtime |
| Prisma ORM | Acesso ao banco |
| Socket.IO | Comunicação em tempo real |
| BullMQ + Redis | Filas e jobs assíncronos |

### Banco e Infra
| Serviço | Papel |
|---|---|
| PostgreSQL (Supabase) | Banco principal |
| Vercel | Deploy frontend |
| Railway / Render | Deploy backend |
| Redis | Cache + filas |

### Integrações
| Serviço | Papel |
|---|---|
| Evolution API | Gateway WhatsApp |
| OpenAI API (GPT-4.1 Mini) | IA de classificação operacional |

---

## 4. CONCEITO VISUAL (Design System)

### 4.1 Identidade Visual
Extraída do conceito oficial aprovado:

**Tema:** Dark industrial — fundo quase preto com acentos coloridos vibrantes  
**Sensação:** Moderno, operacional, rápido, data-driven

### 4.2 Paleta de Cores

| Papel | Cor | Hex aproximado |
|---|---|---|
| Background primário | Quase preto | `#0A0B10` |
| Background card | Dark navy | `#10131A` |
| Background surface | Dark slate | `#161B27` |
| Borda/separador | Slate escuro | `#1E2535` |
| Accent primário | Azul/Indigo | `#4F6EF7` |
| WhatsApp / Sucesso | Verde | `#25D366` |
| Alerta / SLA crítico | Vermelho | `#EF4444` |
| Aviso / SLA próximo | Âmbar | `#F59E0B` |
| Info / Em andamento | Azul claro | `#3B82F6` |
| Texto primário | Branco suave | `#F1F5F9` |
| Texto secundário | Cinza azulado | `#94A3B8` |
| Texto terciário | Cinza escuro | `#475569` |

### 4.3 Tipografia
- **Font:** Inter ou Geist (padrão Next.js 15)
- **KPI numbers:** Font-weight 700, tamanho grande (3xl–4xl)
- **Labels:** Uppercase, letter-spacing, font-size sm, cor secundária
- **Body:** Regular, cor primária ou secundária

### 4.4 Componentes Visuais Definidos

#### Cards KPI (Dashboard)
```
┌─────────────────────────┐
│  LABEL EM CIMA          │
│  128        [ícone]     │
│  +12% vs ontem          │
└─────────────────────────┘
```
- Background: `#10131A`
- Borda sutil: `1px solid #1E2535`
- Número grande, bold, cor branca
- Variação com cor verde (positivo) ou vermelho (negativo)

#### Cards de Ticket (Kanban)
```
┌─────────────────────────┐
│ [PRIORIDADE] #TK-0042   │
│ Máquina 08 parada       │
│ Manutenção              │
│ ─────────────────────── │
│ 🕐 2h restantes  [SLA]  │
│ Avatar  João Silva      │
└─────────────────────────┘
```
- Badge de prioridade colorido (vermelho=crítica, âmbar=alta, azul=média, cinza=baixa)
- Barra de SLA visual no rodapé
- Hover com leve elevação/brilho

#### Sidebar/Nav
- Fundo: `#0A0B10`
- Logo OperaFlow no topo
- Ícones + labels
- Item ativo: fundo `#1E2535`, accent azul lateral
- Indicadores de contagem (badges) em vermelho

### 4.5 Telas do MVP (Inventário Visual)

| Tela | Descrição |
|---|---|
| **Login** | Centralizado, logo OperaFlow, campo email/senha, dark clean |
| **Dashboard** | KPIs (total, abertos, atrasados, % SLA), gráfico barras por setor, donut por prioridade, feed de atividade recente |
| **Kanban** | 6 colunas (Aberto/Em andamento/Aguardando/Escalado/Finalizado/Cancelado), drag and drop, cards com SLA visual |
| **Detalhe do Ticket** | Timeline vertical, comentários, histórico de status, SLA countdown, responsável, arquivos |
| **WhatsApp Chat View** | Interface estilo mobile com bolhas de mensagem, histórico de conversa vinculado ao ticket |
| **Gestão de Usuários** | Tabela com filtros, avatar, role badge, status ativo/inativo, actions |
| **Gestão de Setores** | Cards ou tabela, SLA padrão por setor, responsável, indicadores |
| **Configuração SLA** | Matriz setor × prioridade com campos de tempo |
| **Relatórios** | Gráficos de performance, tempo médio, setores mais demandados, ranking máquinas |

### 4.6 KPIs Exibidos no Dashboard (referência visual)

| KPI | Ícone | Cor destaque |
|---|---|---|
| Total de chamados | Ticket | Azul |
| Chamados abertos | Play | Verde |
| Chamados atrasados | Clock | Vermelho |
| Conformidade SLA (%) | Shield | Verde/Âmbar/Vermelho |
| Tempo médio atendimento | Timer | Azul |
| Chamados por setor | Bar chart | Variado |
| Distribuição por prioridade | Donut | Variado |

---

## 5. FUNCIONALIDADES MVP

### Módulos

| # | Módulo | Status inicial |
|---|---|---|
| 1 | Autenticação (JWT + perfis) | Sprint 1 |
| 2 | Gestão de Usuários | Sprint 1 |
| 3 | Gestão de Setores | Sprint 1 |
| 4 | Tickets operacionais | Sprint 2 |
| 5 | Kanban (drag and drop + realtime) | Sprint 2 |
| 6 | Dashboard com KPIs | Sprint 2 |
| 7 | Integração WhatsApp (Evolution API) | Sprint 3 |
| 8 | IA de classificação (GPT-4.1 Mini) | Sprint 4 |
| 9 | SLA automático | Sprint 4 |
| 10 | Escalonamento automático | Sprint 4 |

### Perfis de acesso
`operador` → `supervisor` → `coordenador` → `gerente` → `administrador`

### Status de ticket
`aberto` → `em_andamento` → `aguardando` → `escalado` → `finalizado` / `cancelado`

### Prioridades
`baixa` | `media` | `alta` | `critica`

---

## 6. BANCO DE DADOS

```sql
users
  id, name, email, password_hash, role, sector_id,
  is_active, created_at, updated_at

sectors
  id, name, sla_default_hours, responsible_id,
  created_at, updated_at

tickets
  id, title, description, status, priority,
  sector_id, responsible_id, created_by,
  source (manual|whatsapp|api),
  sla_due_date, escalation_level,
  created_at, updated_at, closed_at

ticket_messages
  id, ticket_id, content, author_id,
  source (internal|whatsapp|system),
  created_at

ticket_attachments
  id, ticket_id, filename, url, created_at

escalations
  id, ticket_id, escalation_level,
  escalated_to, reason, created_at

sla_config
  id, sector_id, priority, hours_limit, created_at

ai_logs
  id, raw_message, ai_response (jsonb),
  confidence, ticket_id, created_at

notifications
  id, user_id, title, message, type,
  is_read, created_at

whatsapp_contacts
  id, phone, name, last_ticket_id, created_at
```

---

## 7. FLUXO WHATSAPP + IA

### Entrada de mensagem
```
1. Usuário envia mensagem no WhatsApp
2. Evolution API dispara webhook → POST /whatsapp/webhook
3. Backend valida e enfileira (BullMQ)
4. Job processa: chama OpenAI com o prompt de classificação
5. IA retorna JSON: { setor, prioridade, urgencia, tipo, sla_sugerido, justificativa, maquina, op }
6. Sistema cria ticket automaticamente
7. SLA calculado e aplicado
8. Responsável notificado (socket + notificação interna)
9. WhatsApp responde ao usuário: "Chamado #TK-0042 aberto. Manutenção · Alta prioridade · SLA: 4h"
```

### Prompt IA (base)
```
Você é um classificador operacional industrial.

Analise a mensagem abaixo e retorne um JSON com:
- setor: (manutencao|producao|qualidade|pcp|compras|seguranca|ti|outros)
- prioridade: (baixa|media|alta|critica)
- urgencia: (baixa|media|alta)
- tipo: (parada_maquina|falta_material|qualidade|seguranca|manutencao_preventiva|outros)
- sla_horas: número inteiro
- maquina: string ou null
- op: string ou null
- justificativa: string curta

Mensagem: "{mensagem}"

Retorne SOMENTE o JSON válido.
```

---

## 8. ARQUITETURA BACKEND (NestJS)

```
src/
├── auth/               # JWT, guards, estratégias
├── users/              # CRUD usuários, perfis
├── sectors/            # CRUD setores, SLA config
├── tickets/            # Core do sistema
│   ├── dto/
│   ├── entities/
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── tickets.module.ts
├── kanban/             # Lógica de board, ordenação
├── whatsapp/           # Webhook Evolution API, parser
├── ai/                 # Integração OpenAI, prompt builder
├── sla/                # Cálculo SLA, monitoramento, jobs
├── escalation/         # Regras e execução de escalonamento
├── dashboard/          # Queries agregadas para KPIs
├── notifications/      # Emissão de alertas internos
├── websocket/          # Gateway Socket.IO
├── jobs/               # BullMQ workers e queues
├── common/
│   ├── decorators/
│   ├── filters/        # Exception filters globais
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
└── prisma/             # PrismaService, schema
```

---

## 9. ARQUITETURA FRONTEND (Next.js 15)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx       # Sidebar + header
│   │   ├── page.tsx         # Dashboard KPIs
│   │   ├── kanban/
│   │   ├── tickets/
│   │   │   └── [id]/
│   │   ├── users/
│   │   ├── sectors/
│   │   ├── sla/
│   │   └── reports/
│   └── api/                 # Route handlers se necessário
├── components/
│   ├── ui/                  # ShadCN base
│   ├── layout/              # Sidebar, Header, Nav
│   ├── dashboard/           # KPI cards, charts
│   ├── kanban/              # Board, column, card
│   ├── tickets/             # Forms, detail, timeline
│   └── common/              # Shared components
├── hooks/                   # Custom hooks
├── lib/
│   ├── api.ts               # Axios/fetch config
│   ├── socket.ts            # Socket.IO client
│   └── utils.ts
├── stores/                  # Zustand stores
└── types/                   # TypeScript types globais
```

---

## 10. REGRAS DE DESENVOLVIMENTO

### NÃO fazer
- Microserviços ou Kubernetes
- App mobile inicialmente
- IA própria (usar OpenAI)
- Over-engineering ou abstrações desnecessárias
- Funcionalidades fora do escopo MVP

### SEMPRE fazer
- Clean Architecture em todas as camadas
- SOLID (especialmente SRP e DIP)
- TypeScript strict, sem `any`
- DTOs com class-validator em todos os endpoints
- Tratamento de erros global (NestJS Exception Filters)
- Logs estruturados (winston ou pino)
- Swagger em todas as rotas
- Variáveis de ambiente validadas (Joi ou Zod no config)
- Índices no banco para queries frequentes

### Padrão de resposta API
```typescript
// Sucesso
{ data: T, message: string, statusCode: number }

// Erro
{ error: string, message: string, statusCode: number }
```

---

## 11. ESCALONAMENTO SLA

| Nível | Gatilho | Ação |
|---|---|---|
| 0 | SLA 75% consumido | Alerta visual no Kanban |
| 1 | SLA vencido (0h) | Notifica responsável + supervisor |
| 2 | SLA +1h vencido | Escala para coordenador, muda status |
| 3 | SLA +4h vencido | Escala para gerente, registra evento crítico |

Job BullMQ roda a cada 5 minutos verificando tickets com `sla_due_date` próximo ou vencido.

---

## 12. SEGURANÇA

- Autenticação: JWT com refresh token
- Senha: bcrypt (rounds ≥ 12)
- Rate limiting: `@nestjs/throttler` nas rotas públicas
- Validação: class-validator em todos os DTOs
- CORS configurado para domínios autorizados
- Webhook Evolution API: validar por secret header
- Variáveis sensíveis: apenas via `.env`, nunca no código

---

## 13. CI/CD

```
GitHub Actions:
├── on push → develop: lint + typecheck + tests
├── on PR → main: lint + typecheck + tests + build
├── on merge → main:
│   ├── deploy frontend (Vercel automático)
│   └── deploy backend (Railway via webhook)
```

Branches: `main` | `develop` | `feature/*` | `hotfix/*`

---

## 14. ROADMAP MVP

| Sprint | Duração | Entregáveis |
|---|---|---|
| Sprint 1 | 1 semana | Setup monorepo, Auth, CRUD usuários e setores, banco |
| Sprint 2 | 1 semana | Tickets, Kanban (drag and drop), Dashboard básico |
| Sprint 3 | 1 semana | Integração WhatsApp (Evolution API), criação automática |
| Sprint 4 | 1 semana | IA classificação, SLA automático, escalonamento |
| Sprint 5 | 1 semana | Testes, ajustes UX, deploy produção, piloto |

---

## 15. DEFINIÇÃO DE PRONTO (DoD)

Um módulo está pronto quando:
- [ ] Código tipado sem erros TypeScript
- [ ] DTOs com validações implementados
- [ ] Service com lógica de negócio isolada
- [ ] Controller REST documentado no Swagger
- [ ] Testes unitários do service (≥ 80% cobertura)
- [ ] Frontend conectado e funcional
- [ ] Mobile responsive
- [ ] Tratamento de erros implementado

---

> **Objetivo final:** MVP funcional, validável comercialmente, com foco em simplicidade, velocidade e operação industrial real. Construir a base certa desde o início para crescer sem reescritas.
