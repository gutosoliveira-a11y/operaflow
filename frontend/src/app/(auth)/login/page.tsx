'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import type { ApiResponse, LoginResponse } from '@/types';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
      });
      login(data.data.accessToken, data.data.user);
      router.replace('/kanban');
    } catch {
      setError('Email ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 mb-4">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">OperaFlow</h1>
          <p className="text-text-secondary text-sm mt-1">Gestão Operacional Industrial</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-text-primary text-lg">Entrar</CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              Use suas credenciais corporativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-text-secondary text-xs uppercase tracking-widest"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-surface border-border text-text-primary placeholder:text-text-muted focus-visible:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-text-secondary text-xs uppercase tracking-widest"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-surface border-border text-text-primary placeholder:text-text-muted focus-visible:ring-accent"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
