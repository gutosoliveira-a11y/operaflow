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
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-text-primary font-semibold">{sector.name}</h3>
              </div>
              <button onClick={() => setModal(sector)}
                className="px-2 py-1 text-xs border border-border rounded hover:bg-background text-text-secondary transition-colors shrink-0">
                Editar
              </button>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                <span>SLA padrão: <span className="text-text-primary font-medium">{sector.slaDefaultHours}h</span></span>
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
