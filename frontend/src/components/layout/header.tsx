'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-text-primary font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <User className="w-4 h-4" />
          <span>{user?.name ?? 'Usuário'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-text-secondary hover:text-text-primary hover:bg-surface h-8 w-8 p-0"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
