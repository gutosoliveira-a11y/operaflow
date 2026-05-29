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

function UserModal({ user, sectors, onClose }: {
  user?: User;
  sectors: { id: string; name: string }[];
  onClose: () => void;
}) {
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
      await updateUser.mutateAsync(body as Parameters<typeof updateUser.mutateAsync>[0]);
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
          <div>
            <label className="block text-xs text-text-secondary mb-1">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} required type="text"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {user ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}
            </label>
            <input value={password} onChange={e => setPassword(e.target.value)} required={!user} type="password"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50" />
          </div>
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
