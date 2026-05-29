'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Columns, Ticket, Users, Building2, Clock, BarChart3, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const nav = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/kanban',    label: 'Kanban',      icon: Columns },
  { href: '/tickets',   label: 'Tickets',     icon: Ticket },
  { href: '/users',     label: 'Usuários',    icon: Users },
  { href: '/sectors',   label: 'Setores',     icon: Building2 },
  { href: '/sla',       label: 'SLA',         icon: Clock },
  { href: '/reports',   label: 'Relatórios',  icon: BarChart3 },
];

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const roleLabel: Record<string, string> = {
  administrador: 'Admin',
  gerente:       'Gerente',
  coordenador:   'Coordenador',
  supervisor:    'Supervisor',
  operador:      'Operador',
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="w-56 min-h-screen bg-background border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 shrink-0"
          style={{ boxShadow: '0 0 12px rgba(79,110,247,0.2)' }}
        >
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <span className="font-bold text-text-primary text-base tracking-tight">OperaFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group',
                active
                  ? 'bg-accent/10 text-text-primary font-medium border-l-2 border-accent'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-2 border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors duration-150',
                  active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings link */}
      <div className="px-2 pb-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-muted hover:bg-surface hover:text-text-secondary transition-all duration-150 border-l-2 border-transparent"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Configurações
        </Link>
      </div>

      {/* User section */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold shrink-0 select-none"
          >
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-medium truncate leading-tight">
              {user?.name ?? 'Usuário'}
            </p>
            <p className="text-text-muted text-[10px] truncate leading-tight">
              {roleLabel[user?.role ?? ''] ?? user?.role ?? '—'}
            </p>
          </div>
          {/* Online indicator */}
          <div className="w-2 h-2 rounded-full bg-success shrink-0" style={{ boxShadow: '0 0 6px rgba(37,211,102,0.6)' }} />
        </div>
      </div>
    </aside>
  );
}
