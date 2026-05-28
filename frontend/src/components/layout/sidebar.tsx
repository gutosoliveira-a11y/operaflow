'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Columns, Ticket, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Columns },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/users', label: 'Usuários', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-background border-r border-border flex flex-col shrink-0">
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/20">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <span className="font-bold text-text-primary text-base">OperaFlow</span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-surface text-text-primary font-medium border-l-2 border-accent'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-text-muted text-xs">v0.1.0 · MVP</p>
      </div>
    </aside>
  );
}
