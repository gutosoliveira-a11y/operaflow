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
                <th key={h} className="px-4 py-3 text-left text-text-secondary font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">#{ticket.id.slice(0,8)}</td>
                  <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{ticket.title}</td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{ticket.sector.name}</td>
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
                  <td className={`px-4 py-3 font-mono text-xs whitespace-nowrap ${sla.color}`}>{sla.text}</td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{ticket.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">{created}</td>
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
              className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-40 transition-colors">
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
