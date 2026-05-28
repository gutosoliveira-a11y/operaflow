# CLAUDE_CODE_PROJECT_MASTER.md
# Plataforma Inteligente de Gestão Operacional Industrial
## Documento Mestre para Execução Técnica do Projeto

> Este documento é o contexto técnico completo do projeto. O arquivo `CLAUDE.md` é o contexto operacional do assistente. Ambos devem ser lidos juntos.

---

## Visão Geral

Plataforma SaaS de orquestração operacional industrial para centralizar solicitações operacionais feitas informalmente dentro da indústria.

Atua como camada inteligente entre: **operação, manutenção, PCP, compras, qualidade e gestão**.

**Diferenciais:**
- Integração com WhatsApp (Evolution API)
- IA operacional (GPT-4.1 Mini)
- Gestão visual (Kanban em tempo real)
- SLA automático por setor e prioridade
- Escalonamento inteligente multinível
- Rastreamento operacional completo
- Dashboard em tempo real (Socket.IO)

**Nome do Produto:** OperaFlow

---

## Objetivo do MVP

Validar:
- Uso operacional real em ambiente industrial
- Integração natural via WhatsApp
- Classificação automática com IA
- Gestão visual eficiente (Kanban)
- SLA e escalonamento automático
- Acompanhamento operacional em tempo real

---

## Stack Oficial

### Frontend
- Next.js 15 (App Router)
- React + TypeScript (strict)
- TailwindCSS
- ShadCN UI
- Zustand (estado global)
- React Query (fetching + cache)

### Backend
- Node.js + NestJS + TypeScript
- Prisma ORM
- Socket.IO (tempo real)
- BullMQ + Redis (filas)

### Banco de Dados
- PostgreSQL (Supabase)

### Infraestrutura
- Frontend: Vercel
- Backend: Railway ou Render
- Cache/Filas: Redis

### Integrações
- WhatsApp: Evolution API (webhook)
- IA: OpenAI API (GPT-4.1 Mini)

---

## Design System (Conceito Visual Aprovado)

### Tema
Dark industrial — fundo quase preto com acentos coloridos. Interface moderna, operacional e data-driven.

### Paleta de Cores

| Papel | Hex |
|---|---|
| Background primário | `#0A0B10` |
| Background card | `#10131A` |
| Background surface | `#161B27` |
| Borda/separador | `#1E2535` |
| Accent primário (Azul/Indigo) | `#4F6EF7` |
| WhatsApp / Sucesso (Verde) | `#25D366` |
| Alerta / SLA crítico (Vermelho) | `#EF4444` |
| Aviso / SLA próximo (Âmbar) | `#F59E0B` |
| Info / Em andamento (Azul) | `#3B82F6` |
| Texto primário | `#F1F5F9` |
| Texto secundário | `#94A3B8` |

### Componentes Visuais

**KPI Cards:**
- Background `#10131A`, borda `1px solid #1E2535`
- Número grande (3xl/4xl bold), label uppercase em cima
- Ícone à direita, variação percentual no rodapé

**Kanban Cards:**
- Badge de prioridade colorido no topo
- Título do ticket, setor abaixo
- Barra de SLA visual no rodapé (verde→âmbar→vermelho)
- Avatar + nome do responsável

**Telas previstas no MVP:**
1. Login — centralizado, dark, logo OperaFlow
2. Dashboard — KPIs + gráficos (barras por setor, donut por prioridade) + feed
3. Kanban — 6 colunas, drag and drop, realtime
4. Detalhe do Ticket — timeline, comentários, SLA countdown
5. Chat WhatsApp — interface estilo mobile vinculada ao ticket
6. Gestão de Usuários — tabela com filtros, badges de role
7. Gestão de Setores — configuração de SLA por setor
8. Configuração SLA — matriz setor × prioridade
9. Relatórios — gráficos de performance e conformidade

---

## Arquitetura do Sistema

**Fluxo principal:**
```
Usuário → WhatsApp → Evolution API → Backend → IA → Banco → Frontend
```

**Pilares técnicos:**
- Monolito modular (não microserviços)
- Clean Architecture + SOLID
- Escalável para multiempresa
- Baixo custo operacional
- Simples de manter e evoluir

### Estrutura do Backend (NestJS)

```
src/
├── auth/
├── users/
├── sectors/
├── tickets/
├── kanban/
├── whatsapp/
├── ai/
├── sla/
├── escalation/
├── dashboard/
├── notifications/
├── websocket/
├── jobs/
├── common/
└── prisma/
```

### Estrutura do Frontend (Next.js 15)

```
src/
├── app/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── kanban/
│       ├── tickets/[id]/
│       ├── users/
│       ├── sectors/
│       ├── sla/
│       └── reports/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── kanban/
│   ├── tickets/
│   └── common/
├── hooks/
├── lib/
├── stores/
└── types/
```

---

## Funcionalidades MVP

### 1. Autenticação
- Login / Logout, JWT + refresh token
- Perfis: Operador → Supervisor → Coordenador → Gerente → Administrador

### 2. Gestão de Usuários
- CRUD, associação de setor, permissões, status ativo/inativo

### 3. Gestão de Setores
- CRUD, SLA padrão, responsáveis, regras operacionais

### 4. Tickets Operacionais
- Criar manual ou via WhatsApp/IA
- Status: `aberto` → `em_andamento` → `aguardando` → `escalado` → `finalizado` / `cancelado`
- Prioridades: `baixa` | `media` | `alta` | `critica`
- Timeline, comentários, anexos, histórico

### 5. Kanban Operacional
- Drag and drop entre colunas
- Atualização em tempo real (Socket.IO)
- Filtros por setor, prioridade, responsável
- SLA visual em cada card

### 6. Integração WhatsApp (Evolution API)
- Webhook: recebe mensagens, áudios, imagens
- Criação automática de tickets
- Resposta automática ao usuário com número do chamado

### 7. IA Operacional (GPT-4.1 Mini)
Retorna JSON com: `setor`, `prioridade`, `urgencia`, `tipo`, `sla_horas`, `maquina`, `op`, `justificativa`

### 8. SLA Automático
- Configurável por setor × prioridade
- Contador regressivo visual
- Job BullMQ a cada 5 min

### 9. Escalonamento Multinível
| Nível | Gatilho | Ação |
|---|---|---|
| 0 | SLA 75% | Alerta visual |
| 1 | SLA vencido | Notifica responsável + supervisor |
| 2 | +1h vencido | Escala coordenador |
| 3 | +4h vencido | Escala gerente |

### 10. Dashboard
KPIs: total, abertos, atrasados, % SLA, tempo médio  
Gráficos: chamados por setor (barras), distribuição por prioridade (donut)

---

## Estrutura do Banco de Dados

```sql
users           → id, name, email, password_hash, role, sector_id, is_active
sectors         → id, name, sla_default_hours, responsible_id
tickets         → id, title, description, status, priority, sector_id,
                  responsible_id, created_by, source, sla_due_date,
                  escalation_level, created_at, updated_at, closed_at
ticket_messages → id, ticket_id, content, author_id, source
ticket_attachments → id, ticket_id, filename, url
escalations     → id, ticket_id, escalation_level, escalated_to, reason
sla_config      → id, sector_id, priority, hours_limit
ai_logs         → id, raw_message, ai_response (jsonb), confidence, ticket_id
notifications   → id, user_id, title, message, type, is_read
whatsapp_contacts → id, phone, name, last_ticket_id
```

---

## Segurança

- JWT com refresh token
- bcrypt (rounds ≥ 12)
- Rate limiting nas rotas públicas
- class-validator em todos os DTOs
- CORS configurado
- Webhook validado por secret header
- Variáveis sensíveis apenas via `.env`

---

## CI/CD

```
GitHub Actions:
├── push → develop:  lint + typecheck + tests
├── PR → main:       lint + typecheck + tests + build
└── merge → main:    deploy Vercel (auto) + deploy Railway (webhook)
```

Branches: `main` | `develop` | `feature/*` | `hotfix/*`

---

## Roadmap MVP

| Sprint | Escopo |
|---|---|
| Sprint 1 | Setup, Auth, Banco, CRUD usuários e setores |
| Sprint 2 | Tickets, Kanban, Dashboard básico |
| Sprint 3 | WhatsApp + Evolution API |
| Sprint 4 | IA, SLA, Escalonamento |
| Sprint 5 | Testes, ajustes UX, deploy, piloto |

---

## Definição de Pronto (DoD)

- [ ] TypeScript sem erros (strict)
- [ ] DTOs com validações
- [ ] Service com lógica isolada
- [ ] Controller documentado no Swagger
- [ ] Testes unitários do service
- [ ] Frontend conectado e funcional
- [ ] Mobile responsive
- [ ] Tratamento de erros implementado

---

> **Objetivo:** MVP funcional, validável comercialmente, com foco em simplicidade, velocidade e operação industrial real.
