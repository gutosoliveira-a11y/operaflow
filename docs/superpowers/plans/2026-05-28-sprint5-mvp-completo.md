# Sprint 5 — MVP Completo OperaFlow: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o OperaFlow completo com 6 páginas frontend, testes ≥80% cobertura, seed de demo realista e deploy em Vercel + Railway.

**Architecture:** Frontend-first — backend recebe dois novos endpoints (SLA config + reports), frontend recebe 6 páginas + 8 hooks. Paginação client-side (FilterTicketsDto sem page/limit). Sem Radix Dialog/Select — modal com div overlay nativo.

**Tech Stack:** Next.js 16.2.6, React 19, Tailwind v4, NestJS 10, Prisma, PostgreSQL (Supabase), Vercel, Railway

---

## File Map

### Backend (modificar)
- `backend/src/sectors/sectors.service.ts` — adicionar `findAllSlaConfig`, `upsertSlaConfig`
- `backend/src/sectors/sectors.controller.ts` — adicionar rotas GET/PATCH sla-config
- `backend/src/dashboard/dashboard.service.ts` — adicionar `getReports(period)`
- `backend/src/dashboard/dashboard.controller.ts` — adicionar rota GET reports

### Frontend (criar)
- `src/types/index.ts` — adicionar `SlaConfig`, `ReportData`, `TicketDetail`, `SectorWithCount`
- `src/components/dashboard/mini-bar-chart.tsx` — extrair do dashboard/page.tsx
- `src/hooks/use-tickets.ts`
- `src/hooks/use-ticket.ts`
- `src/hooks/use-users.ts`
- `src/hooks/use-sectors.ts`
- `src/hooks/use-sla-config.ts`
- `src/hooks/use-reports.ts`
- `src/app/(dashboard)/tickets/page.tsx`
- `src/app/(dashboard)/tickets/[id]/page.tsx`
- `src/app/(dashboard)/users/page.tsx`
- `src/app/(dashboard)/sectors/page.tsx`
- `src/app/(dashboard)/sla/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`

### Frontend (modificar)
- `src/components/layout/sidebar.tsx` — adicionar Setores, SLA, Relatórios ao nav

### Backend (criar)
- `backend/src/sla/sla.service.spec.ts`
- `backend/src/whatsapp/whatsapp.service.spec.ts`
- `backend/prisma/seed-demo.ts`

---

## Task 1: Backend — Endpoints SLA Config + Reports

**Files:**
- Modify: `backend/src/sectors/sectors.service.ts`
- Modify: `backend/src/sectors/sectors.controller.ts`
- Modify: `backend/src/dashboard/dashboard.service.ts`
- Modify: `backend/src/dashboard/dashboard.controller.ts`

- [ ] **Step 1: Adicionar métodos ao SectorsService**

Abrir `backend/src/sectors/sectors.service.ts` e adicionar ao final da classe, antes do `}` de fechamento:

```typescript
  async findAllSlaConfig() {
    return this.prisma.slaConfig.findMany({
      include: { sector: { select: { id: true, name: true } } },
      orderBy: [{ sector: { name: 'asc' } }, { priority: 'asc' }],
    });
  }

  async upsertSlaConfig(sectorId: string, priority: string, hoursLimit: number) {
    await this.findOne(sectorId);
    return this.prisma.slaConfig.upsert({
      where: { sectorId_priority: { sectorId, priority: priority as any } },
      create: { sectorId, priority: priority as any, hoursLimit },
      update: { hoursLimit },
    });
  }
```

- [ ] **Step 2: Adicionar rotas ao SectorsController**

Abrir `backend/src/sectors/sectors.controller.ts`. Adicionar `Query` ao import do `@nestjs/common`. Adicionar as duas rotas ANTES do `@Get(':id')` existente (para evitar conflito de rota):

```typescript
  @Get('sla-config')
  @ApiOperation({ summary: 'Listar todas as configurações SLA' })
  findAllSlaConfig() { return this.sectorsService.findAllSlaConfig(); }

  @Patch(':id/sla-config')
  @Roles(Role.administrador, Role.gerente, Role.coordenador)
  @ApiOperation({ summary: 'Atualizar configuração SLA de um setor' })
  upsertSlaConfig(
    @Param('id') id: string,
    @Body() body: { priority: string; hoursLimit: number },
  ) { return this.sectorsService.upsertSlaConfig(id, body.priority, body.hoursLimit); }
```

- [ ] **Step 3: Adicionar getReports ao DashboardService**

Abrir `backend/src/dashboard/dashboard.service.ts`. Adicionar ao final da classe antes do `}`:

```typescript
  async getReports(period: number) {
    const since = new Date();
    since.setDate(since.getDate() - period);

    const [ticketsBySector, finalized, slaConfigs, sectors] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['sectorId'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.finalizado,
          closedAt: { gte: since },
          slaDueDate: { not: null },
          createdAt: { not: null },
        },
        select: { priority: true, slaDueDate: true, closedAt: true, createdAt: true, sectorId: true },
      }),
      this.prisma.slaConfig.findMany(),
      this.prisma.sector.findMany({ select: { id: true, name: true } }),
    ]);

    const sectorMap = Object.fromEntries(sectors.map((s) => [s.id, s.name]));

    const byPriority: Record<string, { total: number; sumHours: number }> = {};
    for (const t of finalized) {
      const p = t.priority as string;
      if (!byPriority[p]) byPriority[p] = { total: 0, sumHours: 0 };
      byPriority[p].total += 1;
      byPriority[p].sumHours += (t.closedAt!.getTime() - t.createdAt.getTime()) / 3_600_000;
    }

    const bySectorCompliance: Record<string, { onTime: number; total: number }> = {};
    for (const t of finalized) {
      const s = t.sectorId;
      if (!bySectorCompliance[s]) bySectorCompliance[s] = { onTime: 0, total: 0 };
      bySectorCompliance[s].total += 1;
      if (t.closedAt! <= t.slaDueDate!) bySectorCompliance[s].onTime += 1;
    }

    return {
      period,
      ticketsBySector: ticketsBySector.map((b) => ({
        sectorId: b.sectorId,
        sectorName: sectorMap[b.sectorId] ?? b.sectorId,
        count: b._count.id,
      })),
      avgResolutionByPriority: Object.entries(byPriority).map(([priority, d]) => ({
        priority,
        avgHours: d.total > 0 ? Math.round(d.sumHours / d.total) : 0,
      })),
      slaComplianceBySector: Object.entries(bySectorCompliance).map(([sectorId, d]) => ({
        sectorId,
        sectorName: sectorMap[sectorId] ?? sectorId,
        compliance: d.total > 0 ? Math.round((d.onTime / d.total) * 100) : 100,
      })),
    };
  }
```

- [ ] **Step 4: Adicionar rota ao DashboardController**

Abrir `backend/src/dashboard/dashboard.controller.ts`. Adicionar `Query, ParseIntPipe, DefaultValuePipe` ao import. Adicionar rota:

```typescript
  @Get('reports')
  @ApiOperation({ summary: 'Relatórios agregados por período' })
  getReports(@Query('period', new DefaultValuePipe(30), ParseIntPipe) period: number) {
    return this.dashboardService.getReports(period);
  }
```

- [ ] **Step 5: Build para verificar erros**

```bash
cd backend && npm run build 2>&1 | tail -20
```

Esperado: `Successfully compiled` sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git -C backend add -A && git -C backend commit -m "feat(backend): add sla-config endpoints and reports endpoint"
```

---

## Task 2: Frontend — Types + MiniBarChart + Hooks

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/components/dashboard/mini-bar-chart.tsx`
- Create: `src/hooks/use-tickets.ts`
- Create: `src/hooks/use-ticket.ts`
- Create: `src/hooks/use-users.ts`
- Create: `src/hooks/use-sectors.ts`
- Create: `src/hooks/use-sla-config.ts`
- Create: `src/hooks/use-reports.ts`

- [ ] **Step 1: Atualizar types/index.ts**

Adicionar ao final do arquivo `src/types/index.ts`:

```typescript
export interface SlaConfig {
  id: string;
  sectorId: string;
  priority: Priority;
  hoursLimit: number;
  sector: { id: string; name: string };
}

export interface SectorWithCount extends Sector {
  _count?: { tickets: number };
  openTickets?: number;
}

export interface ReportData {
  period: number;
  ticketsBySector: { sectorId: string; sectorName: string; count: number }[];
  avgResolutionByPriority: { priority: string; avgHours: number }[];
  slaComplianceBySector: { sectorId: string; sectorName: string; compliance: number }[];
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}
```

- [ ] **Step 2: Criar MiniBarChart component**

Criar `src/components/dashboard/mini-bar-chart.tsx`:

```typescript
'use client';

interface Bar {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  bars: Bar[];
  colorClass?: string;
  maxValue?: number;
}

export function MiniBarChart({ bars, colorClass = 'bg-accent', maxValue }: MiniBarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {bars.map((bar) => {
        const pct = max > 0 ? Math.round((bar.value / max) * 100) : 0;
        return (
          <div key={bar.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-full flex items-end" style={{ height: '48px' }}>
              <div
                className={`w-full rounded-sm transition-all duration-300 ${colorClass}`}
                style={{ height: `${Math.max(pct, 4)}%`, opacity: 0.8 + pct * 0.002 }}
                title={`${bar.label}: ${bar.value}`}
              />
            </div>
            <span className="text-text-muted text-[9px] truncate w-full text-center leading-none">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Criar hooks**

Criar `src/hooks/use-tickets.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Ticket } from '@/types';

export interface TicketFilters {
  status?: string;
  priority?: string;
  sectorId?: string;
  search?: string;
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.sectorId) params.set('sectorId', filters.sectorId);
      if (filters.search) params.set('search', filters.search);
      const { data } = await api.get<ApiResponse<Ticket[]>>(`/tickets?${params}`);
      return data.data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      sectorId: string;
      priority: string;
    }) => {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}
```

Criar `src/hooks/use-ticket.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Ticket } from '@/types';

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
      return data.data;
    },
    staleTime: 10_000,
  });
}

export function useUpdateTicketStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useAddComment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/tickets/${ticketId}/comments`, { content });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket', ticketId] }),
  });
}
```

Criar `src/hooks/use-users.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, User } from '@/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>('/users');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; email: string; password: string; role: string; sectorId?: string }) => {
      const { data } = await api.post<ApiResponse<User>>('/users', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<{ name: string; email: string; role: string; sectorId: string | null; isActive: boolean; password: string }>) => {
      const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

Criar `src/hooks/use-sectors.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Sector } from '@/types';

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Sector[]>>('/sectors');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; slaDefaultHours: number; responsibleId?: string }) => {
      const { data } = await api.post<ApiResponse<Sector>>('/sectors', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}

export function useUpdateSector(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<{ name: string; slaDefaultHours: number; responsibleId: string | null }>) => {
      const { data } = await api.patch<ApiResponse<Sector>>(`/sectors/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}
```

Criar `src/hooks/use-sla-config.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, SlaConfig } from '@/types';

export function useSlaConfig() {
  return useQuery({
    queryKey: ['sla-config'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SlaConfig[]>>('/sectors/sla-config');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useUpsertSlaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectorId, priority, hoursLimit }: { sectorId: string; priority: string; hoursLimit: number }) => {
      const { data } = await api.patch<ApiResponse<SlaConfig>>(`/sectors/${sectorId}/sla-config`, { priority, hoursLimit });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla-config'] }),
  });
}
```

Criar `src/hooks/use-reports.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, ReportData } from '@/types';

export function useReports(period: number) {
  return useQuery({
    queryKey: ['reports', period],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReportData>>(`/dashboard/reports?period=${period}`);
      return data.data;
    },
    staleTime: 60_000,
  });
}
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\frontend"; npx tsc --noEmit 2>&1 | Select-Object -Last 15
```

Esperado: 0 erros.

- [ ] **Step 5: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): add types, MiniBarChart, and 6 data hooks"
```

---

## Task 3: Frontend — Atualizar Sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Atualizar nav array**

No arquivo `src/components/layout/sidebar.tsx`, substituir o import de ícones e o array `nav`:

```typescript
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Columns, Ticket, Users, Building2, Clock, BarChart3, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/kanban',     label: 'Kanban',      icon: Columns },
  { href: '/tickets',    label: 'Tickets',     icon: Ticket },
  { href: '/users',      label: 'Usuários',    icon: Users },
  { href: '/sectors',    label: 'Setores',     icon: Building2 },
  { href: '/sla',        label: 'SLA',         icon: Clock },
  { href: '/reports',    label: 'Relatórios',  icon: BarChart3 },
];
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): add sectors, sla, reports to sidebar nav"
```

---

## Task 4: Frontend — Página /tickets

**Files:**
- Create: `src/app/(dashboard)/tickets/page.tsx`

- [ ] **Step 1: Criar página de lista de tickets**

Criar `src/app/(dashboard)/tickets/page.tsx`:

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTickets, useCreateTicket } from '@/hooks/use-tickets';
import { useSectors } from '@/hooks/use-sectors';
import type { Priority, TicketStatus } from '@/types';

const PAGE_SIZE = 20;

const priorityBadge: Record<Priority, string> = {
  critica: 'bg-danger/15 text-danger border-danger/30',
  alta:    'bg-warning/15 text-warning border-warning/30',
  media:   'bg-info/15 text-info border-info/30',
  baixa:   'bg-surface text-text-secondary border-border',
};

const statusBadge: Record<TicketStatus, string> = {
  aberto:       'bg-info/15 text-info border-info/30',
  em_andamento: 'bg-success/15 text-success border-success/30',
  aguardando:   'bg-warning/15 text-warning border-warning/30',
  escalado:     'bg-danger/15 text-danger border-danger/30',
  finalizado:   'bg-surface text-text-secondary border-border',
  cancelado:    'bg-surface text-text-muted border-border',
};

const statusLabel: Record<TicketStatus, string> = {
  aberto: 'Aberto', em_andamento: 'Em Andamento', aguardando: 'Aguardando',
  escalado: 'Escalado', finalizado: 'Finalizado', cancelado: 'Cancelado',
};

function formatSla(slaDueDate: string | null): { text: string; color: string } {
  if (!slaDueDate) return { text: '—', color: 'text-text-muted' };
  const diff = new Date(slaDueDate).getTime() - Date.now();
  if (diff < 0) return { text: 'Vencido', color: 'text-danger' };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return {
    text: h > 0 ? `${h}h ${m}m` : `${m}m`,
    color: diff < 3_600_000 ? 'text-danger' : diff < 7_200_000 ? 'text-warning' : 'text-text-secondary',
  };
}

export default function TicketsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newPriority, setNewPriority] = useState('media');

  const { data: allTickets = [], isLoading } = useTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    sectorId: sectorFilter || undefined,
    search: search || undefined,
  });
  const { data: sectors = [] } = useSectors();
  const createTicket = useCreateTicket();

  const filtered = useMemo(() => {
    if (!search) return allTickets;
    const q = search.toLowerCase();
    return allTickets.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }, [allTickets, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newSector) return;
    await createTicket.mutateAsync({ title: newTitle, description: newDesc, sectorId: newSector, priority: newPriority });
    setShowModal(false);
    setNewTitle(''); setNewDesc(''); setNewSector(''); setNewPriority('media');
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Tickets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por título ou ID..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
          <option value="">Todos os status</option>
          {(['aberto','em_andamento','aguardando','escalado','finalizado','cancelado'] as TicketStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
          <option value="">Todas as prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select value={sectorFilter} onChange={(e) => { setSectorFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
          <option value="">Todos os setores</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['#ID','Título','Setor','Prioridade','Status','SLA','Responsável','Criado em'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-text-secondary font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">Carregando...</td></tr>
            )}
            {!isLoading && paged.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">Nenhum ticket encontrado</td></tr>
            )}
            {paged.map((ticket) => {
              const sla = formatSla(ticket.slaDueDate);
              const created = new Date(ticket.createdAt).toLocaleDateString('pt-BR');
              return (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  className="border-b border-border last:border-0 hover:bg-background/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-text-muted font-mono">#{ticket.id.slice(0,8)}</td>
                  <td className="px-4 py-3 text-text-primary font-medium max-w-48 truncate">{ticket.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{ticket.sector.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${priorityBadge[ticket.priority]}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${statusBadge[ticket.status]}`}>
                      {statusLabel[ticket.status]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs ${sla.color}`}>{sla.text}</td>
                  <td className="px-4 py-3 text-text-secondary">{ticket.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{filtered.length} tickets · página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Novo Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Título *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Descrição</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Setor *</label>
                <select value={newSector} onChange={(e) => setNewSector(e.target.value)} required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
                  <option value="">Selecionar setor</option>
                  {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Prioridade</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createTicket.isPending}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60 transition-colors">
                  {createTicket.isPending ? 'Criando...' : 'Criar Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): tickets list page with filters and create modal"
```

---

## Task 5: Frontend — Página /tickets/[id]

**Files:**
- Create: `src/app/(dashboard)/tickets/[id]/page.tsx`

- [ ] **Step 1: Criar página de detalhe do ticket**

Criar `src/app/(dashboard)/tickets/[id]/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Clock, User, Building2, AlertCircle } from 'lucide-react';
import { useTicket, useUpdateTicketStatus, useAddComment } from '@/hooks/use-ticket';
import { useUsers } from '@/hooks/use-users';
import type { TicketStatus, Priority } from '@/types';

const statusLabel: Record<TicketStatus, string> = {
  aberto: 'Aberto', em_andamento: 'Em Andamento', aguardando: 'Aguardando',
  escalado: 'Escalado', finalizado: 'Finalizado', cancelado: 'Cancelado',
};
const statusOptions: TicketStatus[] = ['aberto','em_andamento','aguardando','escalado','finalizado','cancelado'];

const priorityColors: Record<Priority, string> = {
  critica: 'text-danger bg-danger/10 border-danger/30',
  alta:    'text-warning bg-warning/10 border-warning/30',
  media:   'text-info bg-info/10 border-info/30',
  baixa:   'text-text-secondary bg-surface border-border',
};

function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
}

function formatTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function SlaCountdown({ slaDueDate }: { slaDueDate: string | null }) {
  if (!slaDueDate) return <span className="text-text-muted text-sm">Sem SLA</span>;
  const diff = new Date(slaDueDate).getTime() - Date.now();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const text = overdue ? `Vencido há ${h}h ${m}m` : `${h}h ${m}m restantes`;
  const color = overdue ? 'text-danger' : diff < 3_600_000 ? 'text-warning' : 'text-success';
  const pct = overdue ? 0 : Math.min(100, (diff / (24 * 3_600_000)) * 100);

  return (
    <div className="space-y-1.5">
      <span className={`text-sm font-medium ${color} ${overdue ? 'animate-sla-pulse' : ''}`}>{text}</span>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overdue ? 'bg-danger' : diff < 3_600_000 ? 'bg-warning' : 'bg-success'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: ticket, isLoading } = useTicket(id);
  const { data: users = [] } = useUsers();
  const updateStatus = useUpdateTicketStatus(id);
  const addComment = useAddComment(id);
  const [comment, setComment] = useState('');

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment.trim());
    setComment('');
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
    </div>
  );

  if (!ticket) return (
    <div className="p-6 text-center text-text-muted">Ticket não encontrado</div>
  );

  const messages = ticket.messages ?? [];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/tickets')}
          className="p-2 rounded-lg border border-border hover:bg-surface transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary flex-1 truncate">{ticket.title}</h1>
        <span className="text-text-muted font-mono text-sm">#{ticket.id.slice(0,8)}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Timeline
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="text-text-muted text-sm text-center py-4">Nenhuma mensagem ainda</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 animate-slide-in-left ${msg.source === 'system' ? 'opacity-70' : ''}`}>
                  {msg.source === 'system' ? (
                    <div className="w-7 h-7 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 text-accent text-[10px] font-bold">
                      {msg.author ? getInitials(msg.author.name) : '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-text-primary text-xs font-medium">
                        {msg.source === 'system' ? 'Sistema' : (msg.author?.name ?? 'Usuário')}
                      </span>
                      <span className="text-text-muted text-[10px]">{formatTime(msg.createdAt)}</span>
                      {msg.source === 'system' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-warning/10 text-warning rounded border border-warning/20">sistema</span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment form */}
            <form onSubmit={handleComment} className="mt-4 pt-4 border-t border-border flex gap-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicionar comentário..."
                rows={2}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
              />
              <button type="submit" disabled={addComment.isPending || !comment.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60 transition-colors self-end">
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</h3>
            <select
              value={ticket.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50"
            >
              {statusOptions.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </div>

          {/* SLA */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> SLA
            </h3>
            <SlaCountdown slaDueDate={ticket.slaDueDate} />
          </div>

          {/* Details */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Detalhes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-secondary">Prioridade:</span>
                <span className={`px-1.5 py-0.5 rounded border text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-secondary">Setor:</span>
                <span className="text-text-primary">{ticket.sector.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-secondary">Responsável:</span>
                <span className="text-text-primary">{ticket.responsible?.name ?? '—'}</span>
              </div>
              <div className="text-text-muted text-xs pt-1 border-t border-border">
                Criado: {formatTime(ticket.createdAt)}<br/>
                Atualizado: {formatTime(ticket.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): ticket detail page with timeline and side panel"
```

---

## Task 6: Frontend — Página /users

**Files:**
- Create: `src/app/(dashboard)/users/page.tsx`

- [ ] **Step 1: Criar página de usuários**

Criar `src/app/(dashboard)/users/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/use-users';
import { useSectors } from '@/hooks/use-sectors';
import type { User, Role } from '@/types';

const roleLabel: Record<Role, string> = {
  administrador: 'Admin', gerente: 'Gerente', coordenador: 'Coordenador',
  supervisor: 'Supervisor', operador: 'Operador',
};
const roleColors: Record<Role, string> = {
  administrador: 'bg-danger/15 text-danger border-danger/30',
  gerente:       'bg-warning/15 text-warning border-warning/30',
  coordenador:   'bg-accent/15 text-accent border-accent/30',
  supervisor:    'bg-info/15 text-info border-info/30',
  operador:      'bg-surface text-text-secondary border-border',
};

function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
}

function UserModal({ user, sectors, onClose }: { user?: User; sectors: { id: string; name: string }[]; onClose: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(user?.role ?? 'operador');
  const [sectorId, setSectorId] = useState(user?.sectorId ?? '');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (user) {
      const body: Record<string, unknown> = { name, email, role, sectorId: sectorId || null };
      if (password) body.password = password;
      await updateUser.mutateAsync(body as any);
    } else {
      await createUser.mutateAsync({ name, email, password, role, sectorId: sectorId || undefined });
    }
    onClose();
  }

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Nome *', value: name, onChange: setName, type: 'text', required: true },
            { label: 'Email *', value: email, onChange: setEmail, type: 'email', required: true },
            { label: user ? 'Nova senha (deixe vazio para manter)' : 'Senha *', value: password, onChange: setPassword, type: 'password', required: !user },
          ].map(({ label, value, onChange, type, required }) => (
            <div key={label}>
              <label className="block text-xs text-text-secondary mb-1">{label}</label>
              <input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Perfil</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
              {(['operador','supervisor','coordenador','gerente','administrador'] as Role[]).map((r) => (
                <option key={r} value={r}>{roleLabel[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Setor (opcional)</label>
            <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
              <option value="">Nenhum</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60 transition-colors">
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToggleActive({ user }: { user: User }) {
  const update = useUpdateUser(user.id);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); update.mutate({ isActive: !user.isActive }); }}
      className={`p-1.5 rounded transition-colors ${user.isActive ? 'text-success hover:bg-success/10' : 'text-text-muted hover:bg-surface'}`}
      title={user.isActive ? 'Desativar' : 'Ativar'}
    >
      {user.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
    </button>
  );
}

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: sectors = [] } = useSectors();
  const [modal, setModal] = useState<'create' | User | null>(null);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Usuários</h1>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Usuário','Email','Perfil','Setor','Status','Ações'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-text-secondary font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Carregando...</td></tr>}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-text-primary font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded border text-xs font-medium ${roleColors[user.role]}`}>
                    {roleLabel[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {sectors.find(s => s.id === user.sectorId)?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${user.isActive ? 'text-success' : 'text-text-muted'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <ToggleActive user={user} />
                    <button onClick={() => setModal(user)}
                      className="px-3 py-1.5 text-xs border border-border rounded hover:bg-background text-text-secondary transition-colors">
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal
          user={modal === 'create' ? undefined : modal}
          sectors={sectors}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): users management page"
```

---

## Task 7: Frontend — Página /sectors

**Files:**
- Create: `src/app/(dashboard)/sectors/page.tsx`

- [ ] **Step 1: Criar página de setores**

Criar `src/app/(dashboard)/sectors/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Plus, Building2, Clock, Users } from 'lucide-react';
import { useSectors, useCreateSector, useUpdateSector } from '@/hooks/use-sectors';
import { useUsers } from '@/hooks/use-users';
import type { Sector } from '@/types';

function SectorModal({ sector, users, onClose }: {
  sector?: Sector;
  users: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState(sector?.name ?? '');
  const [slaHours, setSlaHours] = useState(sector?.slaDefaultHours?.toString() ?? '24');
  const [responsibleId, setResponsibleId] = useState(sector?.responsible?.id ?? '');
  const create = useCreateSector();
  const update = useUpdateSector(sector?.id ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name, slaDefaultHours: Number(slaHours), responsibleId: responsibleId || undefined };
    if (sector) {
      await update.mutateAsync(body);
    } else {
      await create.mutateAsync(body);
    }
    onClose();
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">{sector ? 'Editar Setor' : 'Novo Setor'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">SLA padrão (horas)</label>
            <input type="number" min="1" value={slaHours} onChange={e => setSlaHours(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Responsável (opcional)</label>
            <select value={responsibleId} onChange={e => setResponsibleId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50">
              <option value="">Nenhum</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60 transition-colors">
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SectorsPage() {
  const { data: sectors = [], isLoading } = useSectors();
  const { data: users = [] } = useUsers();
  const [modal, setModal] = useState<'create' | Sector | null>(null);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Setores</h1>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Setor
        </button>
      </div>

      {isLoading && <p className="text-text-muted text-sm">Carregando...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sector, i) => (
          <div key={sector.id}
            className="bg-surface border border-border rounded-lg p-4 space-y-3 hover:border-accent/25 hover:shadow-lg transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-text-primary font-semibold">{sector.name}</h3>
              </div>
              <button onClick={() => setModal(sector)}
                className="px-2 py-1 text-xs border border-border rounded hover:bg-background text-text-secondary transition-colors">
                Editar
              </button>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                <span>SLA padrão: <span className="text-text-primary">{sector.slaDefaultHours}h</span></span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <span>Responsável: <span className="text-text-primary">{sector.responsible?.name ?? '—'}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <SectorModal
          sector={modal === 'create' ? undefined : modal}
          users={users}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): sectors management page with grid cards"
```

---

## Task 8: Frontend — Página /sla

**Files:**
- Create: `src/app/(dashboard)/sla/page.tsx`

- [ ] **Step 1: Criar página de configuração SLA**

Criar `src/app/(dashboard)/sla/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSlaConfig, useUpsertSlaConfig } from '@/hooks/use-sla-config';
import { useSectors } from '@/hooks/use-sectors';
import type { Priority } from '@/types';

const PRIORITIES: Priority[] = ['baixa', 'media', 'alta', 'critica'];
const priorityLabel: Record<Priority, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};
const priorityColor: Record<Priority, string> = {
  baixa: 'text-text-secondary', media: 'text-info', alta: 'text-warning', critica: 'text-danger',
};

type CellKey = `${string}_${string}`;

export default function SlaPage() {
  const { data: configs = [], isLoading: loadingConfigs } = useSlaConfig();
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();
  const upsert = useUpsertSlaConfig();

  const [localValues, setLocalValues] = useState<Record<CellKey, string>>({});
  const [original, setOriginal] = useState<Record<CellKey, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const orig: Record<CellKey, number> = {};
    const vals: Record<CellKey, string> = {};
    for (const c of configs) {
      const key: CellKey = `${c.sectorId}_${c.priority}`;
      orig[key] = c.hoursLimit;
      vals[key] = c.hoursLimit.toString();
    }
    setOriginal(orig);
    setLocalValues(vals);
  }, [configs]);

  function getKey(sectorId: string, priority: string): CellKey {
    return `${sectorId}_${priority}` as CellKey;
  }

  function getValue(sectorId: string, priority: string): string {
    const key = getKey(sectorId, priority);
    return localValues[key] ?? original[key]?.toString() ?? '';
  }

  function isDirty(sectorId: string, priority: string): boolean {
    const key = getKey(sectorId, priority);
    const orig = original[key];
    const cur = Number(localValues[key]);
    return orig !== undefined && !isNaN(cur) && cur !== orig && cur > 0;
  }

  async function handleSave() {
    const dirty: { sectorId: string; priority: string; hoursLimit: number }[] = [];
    for (const sector of sectors) {
      for (const priority of PRIORITIES) {
        if (isDirty(sector.id, priority)) {
          const key = getKey(sector.id, priority);
          dirty.push({ sectorId: sector.id, priority, hoursLimit: Number(localValues[key]) });
        }
      }
    }
    if (dirty.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(dirty.map(d => upsert.mutateAsync(d)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const hasDirty = sectors.some(s => PRIORITIES.some(p => isDirty(s.id, p)));

  if (loadingConfigs || loadingSectors) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuração SLA</h1>
          <p className="text-text-secondary text-sm mt-0.5">Horas limite por setor e prioridade</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasDirty || saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-text-secondary font-medium text-xs uppercase tracking-wider w-40">Setor</th>
              {PRIORITIES.map(p => (
                <th key={p} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${priorityColor[p]}`}>
                  {priorityLabel[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector, i) => (
              <tr key={sector.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-background/30'}`}>
                <td className="px-4 py-3 text-text-primary font-medium">{sector.name}</td>
                {PRIORITIES.map(priority => {
                  const dirty = isDirty(sector.id, priority);
                  return (
                    <td key={priority} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={getValue(sector.id, priority)}
                          onChange={e => setLocalValues(v => ({ ...v, [getKey(sector.id, priority)]: e.target.value }))}
                          className={`w-16 px-2 py-1.5 text-center bg-background border rounded text-sm text-text-primary focus:outline-none focus:border-accent/50 tabular-nums transition-colors ${dirty ? 'border-accent/60' : 'border-border'}`}
                        />
                        <span className="text-text-muted text-xs">h</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasDirty && (
        <p className="text-accent text-xs animate-fade-in">Há alterações não salvas</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): SLA configuration matrix page"
```

---

## Task 9: Frontend — Página /reports

**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`

- [ ] **Step 1: Criar página de relatórios**

Criar `src/app/(dashboard)/reports/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { MiniBarChart } from '@/components/dashboard/mini-bar-chart';

const PERIODS = [
  { value: 7,  label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

const priorityLabel: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading } = useReports(period);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${period === value ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets por setor */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary">Tickets por Setor</h2>
            </div>
            <MiniBarChart
              bars={data.ticketsBySector.map(d => ({ label: d.sectorName.slice(0, 8), value: d.count }))}
              colorClass="bg-accent"
            />
            <div className="space-y-1.5">
              {data.ticketsBySector.map(d => (
                <div key={d.sectorId} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{d.sectorName}</span>
                  <span className="text-text-primary font-medium tabular-nums">{d.count}</span>
                </div>
              ))}
              {data.ticketsBySector.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados</p>}
            </div>
          </div>

          {/* Tempo médio por prioridade */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-semibold text-text-primary">Tempo Médio de Resolução</h2>
            </div>
            <MiniBarChart
              bars={data.avgResolutionByPriority.map(d => ({ label: priorityLabel[d.priority] ?? d.priority, value: d.avgHours }))}
              colorClass="bg-warning"
            />
            <div className="space-y-1.5">
              {data.avgResolutionByPriority.map(d => (
                <div key={d.priority} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{priorityLabel[d.priority] ?? d.priority}</span>
                  <span className="text-text-primary font-medium tabular-nums">{d.avgHours}h</span>
                </div>
              ))}
              {data.avgResolutionByPriority.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados</p>}
            </div>
          </div>

          {/* Conformidade SLA por setor */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-success" />
              <h2 className="text-sm font-semibold text-text-primary">Conformidade SLA</h2>
            </div>
            <MiniBarChart
              bars={data.slaComplianceBySector.map(d => ({ label: d.sectorName.slice(0,8), value: d.compliance }))}
              colorClass="bg-success"
              maxValue={100}
            />
            <div className="space-y-1.5">
              {data.slaComplianceBySector.map(d => (
                <div key={d.sectorId} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{d.sectorName}</span>
                  <span className={`font-medium tabular-nums ${d.compliance >= 80 ? 'text-success' : d.compliance >= 60 ? 'text-warning' : 'text-danger'}`}>
                    {d.compliance}%
                  </span>
                </div>
              ))}
              {data.slaComplianceBySector.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```powershell
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\frontend"; npx tsc --noEmit 2>&1 | Select-Object -Last 15
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git -C frontend add -A && git -C frontend commit -m "feat(frontend): reports page with 3 bar charts and period filter"
```

---

## Task 10: Backend — Specs existentes

**Files:** `backend/src/sla/sla.service.spec.ts`, `backend/src/whatsapp/whatsapp.service.spec.ts`

- [ ] **Step 1: Rodar specs existentes**

```bash
cd backend && npm run test -- --passWithNoTests 2>&1 | tail -30
```

Anotar quais specs falham e corrigir mocks desatualizados (ex: campos novos no Prisma).

- [ ] **Step 2: Se algum spec falhar por mock desatualizado**

Verificar o campo específico que causa erro. Exemplo — se `tickets.service.spec.ts` falha por campo ausente no mock:
```typescript
// Adicionar o campo ao objeto mock retornado pelo prisma
const mockTicket = { ..., escalationLevel: 0 };
```

- [ ] **Step 3: Confirmar que todos passam**

```bash
npm run test 2>&1 | grep -E "(PASS|FAIL|Tests:)" | tail -20
```

---

## Task 11: Backend — sla.service.spec.ts

**Files:**
- Create: `backend/src/sla/sla.service.spec.ts`

- [ ] **Step 1: Criar spec do SlaService**

Criar `backend/src/sla/sla.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { SlaService } from './sla.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockPrisma = {
  ticket: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  escalation: {
    create: jest.fn(),
  },
};

const mockNotifications = {
  create: jest.fn(),
};

describe('SlaService', () => {
  let service: SlaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SlaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<SlaService>(SlaService);
    jest.clearAllMocks();
  });

  describe('runCheck', () => {
    it('deve retornar tickets com SLA próximo ou vencido', async () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60_000); // 30 min
      const overdue = new Date(now.getTime() - 60 * 60_000); // 1h atrás

      mockPrisma.ticket.findMany.mockResolvedValue([
        { id: 't1', slaDueDate: soon, escalationLevel: 0, responsibleId: 'u1', sectorId: 's1' },
        { id: 't2', slaDueDate: overdue, escalationLevel: 0, responsibleId: 'u2', sectorId: 's1' },
      ]);

      await service.runCheck();

      expect(mockPrisma.ticket.findMany).toHaveBeenCalled();
    });

    it('não deve disparar escalonamento para tickets sem SLA', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await service.runCheck();

      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
      expect(mockPrisma.escalation.create).not.toHaveBeenCalled();
    });
  });

  describe('escalateToLevel1', () => {
    it('deve criar escalation e notificar quando SLA vence', async () => {
      const ticket = {
        id: 'ticket-1',
        title: 'Prensa parada',
        responsibleId: 'user-1',
        sectorId: 'sector-1',
        escalationLevel: 0,
        slaDueDate: new Date(Date.now() - 1000),
      };

      mockPrisma.ticket.update.mockResolvedValue({ ...ticket, escalationLevel: 1 });
      mockPrisma.escalation.create.mockResolvedValue({ id: 'esc-1' });
      mockNotifications.create.mockResolvedValue({ id: 'notif-1' });

      await (service as any).escalateToLevel1(ticket);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: ticket.id },
        data: { escalationLevel: 1 },
      });
      expect(mockPrisma.escalation.create).toHaveBeenCalled();
    });
  });

  describe('escalateToLevel2', () => {
    it('deve escalar para coordenador após +1h do SLA vencido', async () => {
      const ticket = {
        id: 'ticket-2',
        title: 'Motor queimado',
        responsibleId: 'user-1',
        sectorId: 'sector-1',
        escalationLevel: 1,
        slaDueDate: new Date(Date.now() - 2 * 3_600_000),
      };

      mockPrisma.ticket.update.mockResolvedValue({ ...ticket, escalationLevel: 2, status: 'escalado' });
      mockPrisma.escalation.create.mockResolvedValue({ id: 'esc-2' });
      mockNotifications.create.mockResolvedValue({ id: 'notif-2' });

      await (service as any).escalateToLevel2(ticket);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ticket.id },
          data: expect.objectContaining({ escalationLevel: 2 }),
        }),
      );
    });
  });

  describe('escalateToLevel3', () => {
    it('deve escalar para gerente após +4h do SLA vencido', async () => {
      const ticket = {
        id: 'ticket-3',
        title: 'Parada geral',
        responsibleId: 'user-1',
        sectorId: 'sector-1',
        escalationLevel: 2,
        slaDueDate: new Date(Date.now() - 5 * 3_600_000),
      };

      mockPrisma.ticket.update.mockResolvedValue({ ...ticket, escalationLevel: 3 });
      mockPrisma.escalation.create.mockResolvedValue({ id: 'esc-3' });
      mockNotifications.create.mockResolvedValue({ id: 'notif-3' });

      await (service as any).escalateToLevel3(ticket);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ticket.id },
          data: expect.objectContaining({ escalationLevel: 3 }),
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Rodar spec**

```bash
cd backend && npm run test -- sla.service.spec 2>&1 | tail -20
```

Se falhar por método privado ou assinatura diferente, ajustar o mock conforme o service real.

- [ ] **Step 3: Commit**

```bash
git -C backend add -A && git -C backend commit -m "test(backend): add sla.service.spec.ts with 4 escalation tests"
```

---

## Task 12: Backend — whatsapp.service.spec.ts

**Files:**
- Create: `backend/src/whatsapp/whatsapp.service.spec.ts`

- [ ] **Step 1: Ler WhatsappService para conhecer assinaturas**

```bash
cat backend/src/whatsapp/whatsapp.service.ts | head -80
```

- [ ] **Step 2: Criar spec**

Criar `backend/src/whatsapp/whatsapp.service.spec.ts` (adaptar imports conforme o service real):

```typescript
import { Test } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { TicketsService } from '../tickets/tickets.service';
import { AiService } from '../ai/ai.service';
import { getQueueToken } from '@nestjs/bullmq';

const mockTicketsService = {
  create: jest.fn(),
};

const mockAiService = {
  classify: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

// Mock axios for sendReply
jest.mock('axios', () => ({
  default: { post: jest.fn().mockResolvedValue({ data: {} }) },
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: AiService, useValue: mockAiService },
        { provide: getQueueToken('whatsapp'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    it('deve criar ticket com setor e prioridade da IA quando classificação bem-sucedida', async () => {
      const msg = { from: '5511999999999', body: 'Prensa parada linha 3' };
      mockAiService.classify.mockResolvedValue({
        setor: 'manutencao',
        prioridade: 'alta',
        urgencia: 'alta',
        tipo: 'parada_maquina',
        sla_horas: 4,
        maquina: 'Prensa L3',
        op: null,
        justificativa: 'Parada de equipamento crítico',
      });
      mockTicketsService.create.mockResolvedValue({ id: 'ticket-1', title: 'Prensa parada linha 3' });

      await (service as any).processMessage(msg);

      expect(mockAiService.classify).toHaveBeenCalledWith(msg.body);
      expect(mockTicketsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'alta' }),
        expect.anything(),
      );
    });

    it('deve usar defaults quando IA falha', async () => {
      const msg = { from: '5511888888888', body: 'Problema urgente' };
      mockAiService.classify.mockRejectedValue(new Error('OpenAI timeout'));
      mockTicketsService.create.mockResolvedValue({ id: 'ticket-2' });

      await (service as any).processMessage(msg);

      expect(mockTicketsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'media' }),
        expect.anything(),
      );
    });
  });

  describe('enqueue', () => {
    it('deve processar diretamente quando Redis indisponível', async () => {
      const msg = { from: '55119', body: 'Teste' };
      mockQueue.add.mockRejectedValue(new Error('Redis connection refused'));
      mockAiService.classify.mockResolvedValue({ setor: 'ti', prioridade: 'baixa', urgencia: 'baixa', tipo: 'outros', sla_horas: 48, maquina: null, op: null, justificativa: '' });
      mockTicketsService.create.mockResolvedValue({ id: 'ticket-3' });

      await service.enqueue(msg);

      // Mesmo com Redis down, ticket é criado
      expect(mockTicketsService.create).toHaveBeenCalled();
    });
  });
});
```

> **Nota:** Se WhatsappService não tem método `enqueue` ou os nomes diferirem, ajustar conforme `whatsapp.service.ts` real.

- [ ] **Step 3: Rodar spec**

```bash
cd backend && npm run test -- whatsapp.service.spec 2>&1 | tail -20
```

- [ ] **Step 4: Checar cobertura geral**

```bash
cd backend && npm run test -- --coverage 2>&1 | grep -E "(All files|services/)" | tail -15
```

Meta: ≥80% nos services.

- [ ] **Step 5: Commit**

```bash
git -C backend add -A && git -C backend commit -m "test(backend): add whatsapp.service.spec.ts with processMessage and enqueue tests"
```

---

## Task 13: Backend — Seed de Demonstração

**Files:**
- Create: `backend/prisma/seed-demo.ts`

- [ ] **Step 1: Criar seed-demo.ts**

Criar `backend/prisma/seed-demo.ts`:

```typescript
import { PrismaClient, Role, TicketStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_USERS = [
  { email: 'gerente@operaflow.com',      name: 'Carlos Mendes',   role: Role.gerente },
  { email: 'coordenador@operaflow.com',  name: 'Ana Lima',        role: Role.coordenador },
  { email: 'supervisor1@operaflow.com',  name: 'Roberto Silva',   role: Role.supervisor },
  { email: 'supervisor2@operaflow.com',  name: 'Fernanda Costa',  role: Role.supervisor },
];

const SLA_MATRIX: Record<string, Record<string, number>> = {
  'Manutenção': { baixa: 24, media: 8,  alta: 4, critica: 1 },
  'Produção':   { baixa: 24, media: 4,  alta: 2, critica: 1 },
  'Qualidade':  { baixa: 48, media: 24, alta: 8, critica: 4 },
  'Segurança':  { baixa: 8,  media: 4,  alta: 1, critica: 1 },
  'TI':         { baixa: 48, media: 24, alta: 8, critica: 4 },
  'PCP':        { baixa: 72, media: 48, alta: 24, critica: 8 },
  'Compras':    { baixa: 72, media: 48, alta: 24, critica: 8 },
};

const DEMO_TICKETS: Array<{
  title: string; description: string; status: TicketStatus; priority: Priority;
  sectorName: string; hoursAgo: number; overdueBy?: number;
}> = [
  // Abertos (10)
  { title: 'Prensa hidráulica L3 — falha de pressão',      description: 'Prensa parou durante ciclo. Pressão zero no manômetro.', status: 'aberto', priority: 'critica', sectorName: 'Manutenção', hoursAgo: 1 },
  { title: 'Falta de EPI setor solda',                      description: 'Luvas e máscaras de solda acabaram no estoque.', status: 'aberto', priority: 'alta', sectorName: 'Segurança', hoursAgo: 3 },
  { title: 'Sistema MES offline',                           description: 'Interface MES não responde. Linha 2 parada.', status: 'aberto', priority: 'critica', sectorName: 'TI', hoursAgo: 0.5 },
  { title: 'Vazamento óleo caixa de redução B7',           description: 'Piso contaminado, risco de acidente.', status: 'aberto', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 2 },
  { title: 'Peça fora de especificação lote #4421',         description: 'Amostra reprovada. Solicitar inspeção completa.', status: 'aberto', priority: 'media', sectorName: 'Qualidade', hoursAgo: 4 },
  { title: 'Falta de matéria-prima — aço carbono 1045',    description: 'Estoque zerou. Produção para em 2h.', status: 'aberto', priority: 'critica', sectorName: 'Compras', hoursAgo: 1.5 },
  { title: 'Rolamento motor bomba #12 com ruído',          description: 'Ruído anormal indicando desgaste. Preventiva urgente.', status: 'aberto', priority: 'media', sectorName: 'Manutenção', hoursAgo: 6 },
  { title: 'Atraso PCP — OP 2024-089 não entregue',        description: 'Ordem de produção atrasada 1 dia. Cliente aguarda.', status: 'aberto', priority: 'alta', sectorName: 'PCP', hoursAgo: 8 },
  { title: 'Temperatura compressor ar acima do limite',    description: 'Sensor indicando 95°C. Limite é 80°C.', status: 'aberto', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 5 },
  { title: 'Impressora etiquetas linha 4 com defeito',     description: 'Saindo etiquetas borradas. Produção em standby.', status: 'aberto', priority: 'baixa', sectorName: 'TI', hoursAgo: 12 },

  // Em andamento (8)
  { title: 'Correia transportadora B2 — troca programada', description: 'Substituição preventiva agendada.', status: 'em_andamento', priority: 'media', sectorName: 'Manutenção', hoursAgo: 10 },
  { title: 'Calibração balança linha 5',                   description: 'Calibração semestral em andamento.', status: 'em_andamento', priority: 'baixa', sectorName: 'Qualidade', hoursAgo: 4 },
  { title: 'Instalação novo servidor backup',              description: 'Migração de dados em progresso.', status: 'em_andamento', priority: 'media', sectorName: 'TI', hoursAgo: 6 },
  { title: 'Inspeção elétrica painéis CLP',                description: 'Equipe elétrica inspecionando todos os painéis.', status: 'em_andamento', priority: 'media', sectorName: 'Manutenção', hoursAgo: 8 },
  { title: 'Negociação fornecedor parafusos M12',          description: 'Contato realizado, aguardando proposta.', status: 'em_andamento', priority: 'baixa', sectorName: 'Compras', hoursAgo: 24 },
  { title: 'Revisão POP linha de montagem',                description: 'Procedimento operacional sendo atualizado.', status: 'em_andamento', priority: 'baixa', sectorName: 'Qualidade', hoursAgo: 16 },
  { title: 'Reparo freio motor esteira L1',                description: 'Desmontagem realizada, peça em análise.', status: 'em_andamento', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 3 },
  { title: 'Treinamento operadores NR-12',                 description: 'Treinamento com 8 operadores em sala.', status: 'em_andamento', priority: 'baixa', sectorName: 'Segurança', hoursAgo: 2 },

  // Aguardando (5)
  { title: 'Aguardando peça — rolamento motor bomba 12',   description: 'Peça solicitada. ETA: 2 dias.', status: 'aguardando', priority: 'media', sectorName: 'Manutenção', hoursAgo: 48 },
  { title: 'Laudo qualidade lote #4421',                   description: 'Enviado para lab externo. Prazo 3 dias úteis.', status: 'aguardando', priority: 'media', sectorName: 'Qualidade', hoursAgo: 72 },
  { title: 'Aprovação orçamento compressor reserva',       description: 'Proposta enviada para aprovação do gerente.', status: 'aguardando', priority: 'alta', sectorName: 'Compras', hoursAgo: 30 },
  { title: 'Resposta fornecedor fluido hidráulico',        description: 'E-mail enviado, aguardando resposta.', status: 'aguardando', priority: 'baixa', sectorName: 'Compras', hoursAgo: 24 },
  { title: 'Revisão técnica CLP linha 2 pelo fabricante',  description: 'Técnico externo agendado para amanhã.', status: 'aguardando', priority: 'alta', sectorName: 'TI', hoursAgo: 12 },

  // Escalados (3) — com SLA vencido
  { title: 'Vazamento óleo compressor central — +4h sem atendimento', description: 'Escalonado após 4h sem resposta. Risco operacional alto.', status: 'escalado', priority: 'critica', sectorName: 'Manutenção', hoursAgo: 6, overdueBy: 4 },
  { title: 'Parada geral linha 2 — escalonamento gerência', description: 'Linha parada há 5h. Prejuízo estimado R$ 50k.', status: 'escalado', priority: 'critica', sectorName: 'Produção', hoursAgo: 5, overdueBy: 5 },
  { title: 'Acidente de trabalho — relatório atrasado',   description: 'Prazo legal para entrega do relatório venceu.', status: 'escalado', priority: 'critica', sectorName: 'Segurança', hoursAgo: 8, overdueBy: 2 },

  // Finalizados (4)
  { title: 'Troca filtro ar comprimido',                   description: 'Manutenção preventiva concluída.', status: 'finalizado', priority: 'baixa', sectorName: 'Manutenção', hoursAgo: 72 },
  { title: 'Atualização firmware CLP linha 3',             description: 'Firmware v3.2.1 instalado com sucesso.', status: 'finalizado', priority: 'media', sectorName: 'TI', hoursAgo: 48 },
  { title: 'Entrega OP 2024-085',                          description: 'Ordem concluída e entregue ao cliente.', status: 'finalizado', priority: 'alta', sectorName: 'PCP', hoursAgo: 96 },
  { title: 'Reposição lubrificante caixa câmbio B1',      description: 'Lubrificação realizada conforme cronograma.', status: 'finalizado', priority: 'baixa', sectorName: 'Manutenção', hoursAgo: 120 },
];

async function main() {
  console.log('🌱 Iniciando seed de demonstração...');

  const passwordHash = await bcrypt.hash('demo123', 12);

  // Upsert usuários demo
  const createdUsers: Record<string, string> = {}; // email → id
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, passwordHash, isActive: true },
      update: { name: u.name, role: u.role },
    });
    createdUsers[u.email] = user.id;
    console.log(`  ✓ Usuário: ${u.email}`);
  }

  // Buscar setores existentes
  const sectors = await prisma.sector.findMany();
  const sectorMap: Record<string, string> = {}; // name → id
  for (const s of sectors) sectorMap[s.name] = s.id;
  console.log(`  ✓ ${sectors.length} setores encontrados`);

  // Upsert configs SLA
  let slaCount = 0;
  for (const [sectorName, priorities] of Object.entries(SLA_MATRIX)) {
    const sectorId = sectorMap[sectorName];
    if (!sectorId) { console.log(`  ⚠ Setor "${sectorName}" não encontrado, pulando SLA`); continue; }
    for (const [priority, hours] of Object.entries(priorities)) {
      await prisma.slaConfig.upsert({
        where: { sectorId_priority: { sectorId, priority: priority as Priority } },
        create: { sectorId, priority: priority as Priority, hoursLimit: hours },
        update: { hoursLimit: hours },
      });
      slaCount++;
    }
  }
  console.log(`  ✓ ${slaCount} configurações SLA`);

  // Buscar admin para createdBy
  const admin = await prisma.user.findFirst({ where: { role: Role.administrador } });
  const createdBy = admin?.id ?? Object.values(createdUsers)[0];

  // Criar tickets
  const supervisors = [createdUsers['supervisor1@operaflow.com'], createdUsers['supervisor2@operaflow.com']].filter(Boolean);
  let ticketCount = 0;

  for (const t of DEMO_TICKETS) {
    const sectorId = sectorMap[t.sectorName];
    if (!sectorId) { console.log(`  ⚠ Setor "${t.sectorName}" não encontrado para ticket "${t.title}"`); continue; }

    const now = new Date();
    const createdAt = new Date(now.getTime() - t.hoursAgo * 3_600_000);
    const slaHours = SLA_MATRIX[t.sectorName]?.[t.priority] ?? 24;
    const slaDueDate = t.overdueBy
      ? new Date(now.getTime() - t.overdueBy * 3_600_000)
      : new Date(createdAt.getTime() + slaHours * 3_600_000);

    const closedAt = t.status === 'finalizado' ? new Date(now.getTime() - (t.hoursAgo - slaHours * 0.8) * 3_600_000) : null;

    await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        sectorId,
        responsibleId: supervisors[ticketCount % supervisors.length] ?? null,
        createdBy,
        source: 'manual',
        slaDueDate,
        escalationLevel: t.status === 'escalado' ? 2 : 0,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 600_000),
        closedAt,
      },
    });
    ticketCount++;
  }
  console.log(`  ✓ ${ticketCount} tickets criados`);

  // Notificações para admin
  if (admin) {
    const escalados = await prisma.ticket.findMany({ where: { status: 'escalado' }, take: 5 });
    for (const ticket of escalados) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: '🚨 Ticket escalado sem atendimento',
          message: `"${ticket.title}" aguarda resolução urgente.`,
          type: 'sla_breach',
          isRead: false,
        },
      });
    }
    console.log(`  ✓ ${escalados.length} notificações criadas para admin`);
  }

  console.log('\n✅ Seed de demonstração concluído!');
  console.log('\nCredenciais demo (senha: demo123):');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(15)} ${u.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Verificar que Notification model tem campo `type`**

```bash
grep -n "type" backend/prisma/schema.prisma | grep -i notification
```

Se `type` não existir no model, usar apenas `title` e `message` sem o campo `type`.

- [ ] **Step 3: Verificar que schema tem `slaConfig` com `sectorId_priority` unique**

```bash
grep -n "slaConfig\|SlaConfig\|sectorId_priority" backend/prisma/schema.prisma
```

- [ ] **Step 4: Rodar seed em dev (opcional, para testar)**

```bash
cd backend && npx ts-node prisma/seed-demo.ts
```

- [ ] **Step 5: Commit**

```bash
git -C backend add -A && git -C backend commit -m "feat(backend): add seed-demo.ts with 30 industrial tickets and demo users"
```

---

## Task 14: Deploy — Railway (Backend)

- [ ] **Step 1: Criar conta Railway**

Acessar [railway.app](https://railway.app) → Login com GitHub.

- [ ] **Step 2: Criar projeto**

Dashboard Railway → "New Project" → "Deploy from GitHub Repo" → selecionar repositório OperaFlow.

- [ ] **Step 3: Configurar serviço**

No painel do serviço criado:
- Settings → Root Directory: `backend`
- Settings → Build Command: `npm run build`
- Settings → Start Command: `node dist/main.js`

- [ ] **Step 4: Adicionar variáveis de ambiente**

Em "Variables", adicionar todas as do arquivo `backend/.env`:
```
DATABASE_URL=<supabase-connection-string>
JWT_SECRET=<seu-secret>
REDIS_URL=<redis-url>
EVOLUTION_API_URL=<url>
EVOLUTION_API_KEY=<key>
OPENAI_API_KEY=<key>
NODE_ENV=production
PORT=3000
```

- [ ] **Step 5: Deploy e copiar URL**

Aguardar deploy terminar. Copiar a URL pública gerada (ex: `operaflow-backend.up.railway.app`).

- [ ] **Step 6: Testar endpoint**

```bash
curl https://operaflow-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@operaflow.com","password":"admin123"}'
```

Esperado: `{ "data": { "accessToken": "..." } }`

---

## Task 15: Deploy — Vercel (Frontend) + Smoke Test

- [ ] **Step 1: Instalar CLI Vercel**

```bash
npm i -g vercel
```

- [ ] **Step 2: Deploy inicial**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\frontend"
vercel
```

Seguir wizard: detecta Next.js automaticamente. Confirmar projeto name e scope.

- [ ] **Step 3: Adicionar variável de ambiente**

No dashboard Vercel → projeto → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://operaflow-backend.up.railway.app/api
```

- [ ] **Step 4: Redeploy com variável**

```bash
vercel --prod
```

- [ ] **Step 5: Rodar seed de demo em produção**

```bash
DATABASE_URL="<supabase-connection-string>" npx ts-node backend/prisma/seed-demo.ts
```

- [ ] **Step 6: Smoke test completo**

Acessar a URL Vercel e verificar:
1. Login com `admin@operaflow.com` / `admin123` → redireciona para `/dashboard`
2. Dashboard carrega KPIs (totalOpen, totalOverdue, bySector)
3. `/kanban` mostra colunas com tickets do seed
4. Criar novo ticket via `/tickets` → aparece na lista
5. Clicar num ticket → abre detalhe com timeline
6. `/reports` carrega os 3 gráficos
7. `/sla` mostra a matriz com valores
8. `/users` lista os usuários demo

- [ ] **Step 7: Commit final**

```bash
git -C frontend add -A && git -C frontend commit -m "chore: sprint 5 complete — all pages, tests, seed, deploy"
```

---

## Checklist DoD

- [ ] 6 páginas frontend funcionais: tickets, tickets/[id], users, sectors, sla, reports
- [ ] TypeScript sem erros em frontend e backend
- [ ] `npm run test` no backend sem falhas
- [ ] sla.service.spec.ts com 4 testes passando
- [ ] whatsapp.service.spec.ts com 3 testes passando
- [ ] Seed demo executado: 4 usuários, 30 tickets, configs SLA, 5 notificações
- [ ] Frontend acessível via URL Vercel
- [ ] Backend acessível via URL Railway
- [ ] Smoke test completo sem erros
