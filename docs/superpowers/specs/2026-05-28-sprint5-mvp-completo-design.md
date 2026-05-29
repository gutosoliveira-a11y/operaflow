# Sprint 5 — MVP Completo: Páginas, Testes, Seed e Deploy

## Goal

Entregar o OperaFlow completo e validável comercialmente: todas as páginas do frontend funcionando, cobertura de testes ≥80% nos services, seed de demonstração realista e plataforma no ar (Vercel + Railway).

## Abordagem

**Opção A — Frontend primeiro, deploy no final:**
- Dias 1–3: 6 páginas frontend
- Dia 4: testes + seed de demo
- Dia 5: setup Vercel + Railway + deploy + smoke test

---

## Seção 1 — Páginas Frontend

### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/app/(dashboard)/tickets/page.tsx` | Lista paginada de tickets com filtros |
| `src/app/(dashboard)/tickets/[id]/page.tsx` | Detalhe: timeline + painel lateral + comentários |
| `src/app/(dashboard)/users/page.tsx` | CRUD de usuários com modal |
| `src/app/(dashboard)/sectors/page.tsx` | CRUD de setores em grid de cards |
| `src/app/(dashboard)/sla/page.tsx` | Matriz setor × prioridade com inputs de horas |
| `src/app/(dashboard)/reports/page.tsx` | 3 gráficos de barras CSS com filtro de período |
| `src/components/dashboard/mini-bar-chart.tsx` | Componente de gráfico extraído do dashboard (reutilizado em reports) |
| `src/hooks/use-tickets.ts` | React Query para lista de tickets (refetch 30s) |
| `src/hooks/use-ticket.ts` | React Query para detalhe de ticket |
| `src/hooks/use-users.ts` | React Query para lista de usuários |
| `src/hooks/use-sectors.ts` | React Query para lista de setores |
| `src/hooks/use-sla-config.ts` | React Query para configurações SLA |
| `src/hooks/use-reports.ts` | React Query para dados de relatórios |

### Página `/tickets` — Lista

- Tabela com colunas: `#ID`, `Título`, `Setor`, `Prioridade` (badge colorido), `Status` (badge), `SLA` (countdown + cor), `Responsável`, `Criado em`
- Filtros: busca por texto (title), dropdown status, dropdown prioridade, dropdown setor
- Botão "Novo Ticket" → modal com campos: título, descrição, setor, prioridade
- Clique na linha → navega para `/tickets/[id]`
- Paginação: 20 por página, controles previous/next
- Endpoint: `GET /api/tickets?status=&priority=&sectorId=&search=&page=&limit=20`
- Endpoint criação: `POST /api/tickets`

### Página `/tickets/[id]` — Detalhe

- Layout duas colunas (lg): esquerda = timeline, direita = painel
- **Timeline:** lista vertical de mensagens/eventos ordenados por `createdAt`. Eventos de sistema (mudança de status, escalonamento) com ícone diferente de comentários internos. Formulário de comentário no rodapé.
- **Painel lateral:** status atual com botão de mudança (dropdown), prioridade, setor, responsável (dropdown de usuários), SLA countdown animado com barra de progresso, `createdAt`, `updatedAt`
- Endpoint detalhe: `GET /api/tickets/:id`
- Endpoint status: `PATCH /api/tickets/:id/status`
- Endpoint comentário: `POST /api/tickets/:id/comments`

### Página `/users` — Gestão

- Tabela: avatar (iniciais), nome, email, role (badge colorido), setor, status ativo/inativo (toggle)
- Modal de criação: nome, email, senha, role, setor (opcional)
- Modal de edição: mesmos campos exceto senha (campo separado "Alterar senha")
- Toggle ativo/inativo via `PATCH /api/users/:id` com `{ isActive: false }`
- Endpoints: `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`

### Página `/sectors` — Gestão

- Grid de cards (2 cols md, 3 cols lg): nome, SLA padrão em horas, responsável, contagem de tickets abertos
- Modal criação/edição: nome, slaDefaultHours, responsibleId
- Endpoints: `GET /api/sectors`, `POST /api/sectors`, `PATCH /api/sectors/:id`

### Página `/sla` — Configuração

- Tabela-matriz: linhas = setores, colunas = prioridades (Baixa, Média, Alta, Crítica)
- Cada célula = `<input type="number" min="1">` com o valor atual de horas
- Botão "Salvar configurações" → faz PATCH para cada célula modificada
- Estado local: `Record<sectorId_priority, hours>` comparado com valores originais
- Endpoint: `PATCH /api/sectors/:id/sla-config` com `{ priority, hoursLimit }`

> **Nota:** Verificar se o endpoint `PATCH /api/sectors/:id/sla-config` existe no backend. Se não, adicionar ao `SectorsController`.

### Página `/reports` — Relatórios

- Filtro de período no topo: 7 dias, 30 dias, 90 dias (padrão: 30d)
- 3 gráficos de barras CSS (componente `MiniBarChart` já existe no dashboard):
  1. **Tickets por setor** (últimos N dias)
  2. **Tempo médio de resolução por prioridade** (em horas)
  3. **Conformidade SLA por setor** (% dentro do prazo)
- Endpoint: `GET /api/dashboard/kpis?period=30` — adicionar suporte ao parâmetro `period` no backend se não existir
- Reutilizar `KpiCard` do dashboard para métricas resumidas no topo

---

## Seção 2 — Testes Backend

### Specs existentes (rodar e corrigir se necessário)
- `auth.service.spec.ts`
- `dashboard.service.spec.ts`
- `sectors.service.spec.ts`
- `tickets.service.spec.ts` ✓ (robusto, 9 casos)
- `users.service.spec.ts`

### Novos specs

**`sla.service.spec.ts`**
- `runCheck()` — identifica tickets próximos do SLA
- `escalateToLevel1()` — notifica responsável + supervisor quando SLA vence
- `escalateToLevel2()` — escala para coordenador após +1h
- `escalateToLevel3()` — escala para gerente após +4h
- Fallback: tickets sem SLA não disparam escalonamento

**`whatsapp.service.spec.ts`**
- `processMessage()` com classificação IA bem-sucedida → cria ticket com setor e prioridade da IA
- `processMessage()` com IA falhando → fallback para defaults (priority: media, primeiro setor)
- `sendReply()` → chama axios.post para Evolution API
- `enqueue()` com Redis indisponível → processa diretamente

Meta: ≥80% cobertura nos services. Sem E2E — Supabase já valida integração em dev.

---

## Seção 3 — Seed de Demonstração

**Arquivo:** `backend/prisma/seed-demo.ts`  
**Execução:** `npx ts-node prisma/seed-demo.ts` (idempotente via upsert)  
**Não destrói dados existentes**

### Dados criados

**Usuários (senha: `demo123`):**
- `gerente@operaflow.com` — Gerente / Carlos Mendes
- `coordenador@operaflow.com` — Coordenador / Ana Lima
- `supervisor1@operaflow.com` — Supervisor / Roberto Silva
- `supervisor2@operaflow.com` — Supervisor / Fernanda Costa

**Setores:** já existem via seed base (Manutenção, Produção, Qualidade, PCP, Compras, Segurança, TI)

**Configurações SLA** (para cada setor × prioridade):

| Setor | Baixa | Média | Alta | Crítica |
|---|---|---|---|---|
| Manutenção | 24h | 8h | 4h | 1h |
| Produção | 24h | 4h | 2h | 1h |
| Qualidade | 48h | 24h | 8h | 4h |
| Segurança | 8h | 4h | 1h | 0.5h → arredonda para 1h |
| TI | 48h | 24h | 8h | 4h |
| PCP | 72h | 48h | 24h | 8h |
| Compras | 72h | 48h | 24h | 8h |

**30 Tickets industriais realistas:**

| Status | Qtd | Exemplos de título |
|---|---|---|
| aberto | 10 | "Prensa hidráulica L3 — falha de pressão", "Falta de EPI setor solda", "Sistema MES offline" |
| em_andamento | 8 | "Correia transportadora B2 — troca programada", "Calibração balança linha 5" |
| aguardando | 5 | "Aguardando peça — rolamento motor bomba 12", "Laudo qualidade lote #4421" |
| escalado | 3 | "Vazamento óleo compressor central — +4h sem atendimento", "Para geral linha 2" |
| finalizado | 4 | "Troca filtro ar comprimido", "Atualização firmware CLP" |

Distribuição: todos os setores contemplados, prioridades variadas, alguns com SLA vencido para demonstrar escalonamento visual.

**5 notificações não lidas** para o admin: alertas de SLA dos tickets escalados.

---

## Seção 4 — Deploy

### Frontend — Vercel

1. Criar conta em [vercel.com](https://vercel.com) (pode usar GitHub OAuth)
2. Instalar CLI: `npm i -g vercel`
3. Na pasta `frontend/`: `vercel` → segue wizard (detecta Next.js automaticamente)
4. Adicionar variável de ambiente no dashboard Vercel: `NEXT_PUBLIC_API_URL=https://<url-railway>/api`
5. Redeploy: `vercel --prod`
6. Deploy automático em pushes futuros para `main`

### Backend — Railway

1. Criar conta em [railway.app](https://railway.app) (pode usar GitHub OAuth)
2. New Project → Deploy from GitHub Repo → selecionar o repositório
3. Root directory: `backend`
4. Build command: `npm run build`
5. Start command: `node dist/main.js`
6. Adicionar todas as variáveis do `.env` no painel Railway (inclusive `DATABASE_URL` do Supabase)
7. Railway gera URL pública automática (ex: `operaflow-backend.up.railway.app`)

### Ordem do dia do deploy

1. Deploy backend no Railway → copiar URL gerada
2. Configurar `NEXT_PUBLIC_API_URL` no Vercel com `https://<url-railway>/api`
3. Deploy frontend no Vercel
4. Rodar seed de demo: `DATABASE_URL=<supabase-url> npx ts-node prisma/seed-demo.ts`
5. **Smoke test:**
   - Login com `admin@operaflow.com` / `admin123`
   - Dashboard carrega KPIs
   - Kanban mostra tickets
   - Criar novo ticket manualmente
   - Mover ticket no kanban
   - Acessar `/reports`

---

## Checklist de DoD (Definition of Done)

- [ ] 6 páginas frontend funcionais e responsivas
- [ ] Testes passando: `npm run test` no backend sem falhas
- [ ] Seed de demo executado com sucesso no banco de produção
- [ ] Frontend acessível via URL Vercel
- [ ] Backend acessível via URL Railway
- [ ] Smoke test completo sem erros

---

## Tech Stack (sem mudanças)

- **Frontend:** Next.js 16.2.6, React 19, Tailwind v4, ShadCN UI, Zustand v5, React Query v5
- **Backend:** NestJS 10, Prisma ORM, PostgreSQL (Supabase), BullMQ + Redis
- **Deploy:** Vercel (frontend) + Railway (backend)
