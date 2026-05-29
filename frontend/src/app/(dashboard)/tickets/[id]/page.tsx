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
  const { data: _users = [] } = useUsers();
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
        <span className="text-text-muted font-mono text-sm shrink-0">#{ticket.id.slice(0,8)}</span>
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
                <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-secondary">Prioridade:</span>
                <span className={`px-1.5 py-0.5 rounded border text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-secondary">Setor:</span>
                <span className="text-text-primary">{ticket.sector.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-secondary">Responsável:</span>
                <span className="text-text-primary">{ticket.responsible?.name ?? '—'}</span>
              </div>
              <div className="text-text-muted text-xs pt-2 border-t border-border space-y-0.5">
                <p>Criado: {formatTime(ticket.createdAt)}</p>
                <p>Atualizado: {formatTime(ticket.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
