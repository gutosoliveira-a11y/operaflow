'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useUnreadCount } from '@/hooks/use-notifications';

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const unreadCount = useUnreadCount();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-text-primary font-semibold text-lg tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Notificações"
            className="text-text-secondary hover:text-text-primary hover:bg-surface h-9 w-9 p-0 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Button>
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold leading-none pointer-events-none"
              style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* User avatar + name */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/20 text-accent text-xs font-bold select-none cursor-default"
          >
            {getInitials(user?.name)}
          </div>
          <span className="text-text-secondary text-sm hidden md:block">
            {user?.name?.split(' ')[0] ?? 'Usuário'}
          </span>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="Sair"
          className="text-text-secondary hover:text-danger hover:bg-danger/10 h-8 w-8 p-0 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
