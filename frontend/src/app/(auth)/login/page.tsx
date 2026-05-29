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
      router.replace('/dashboard');
    } catch {
      setError('Email ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(79,110,247,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(79,110,247,0.3), transparent)' }}
      />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 mb-5 border border-accent/20"
            style={{ boxShadow: '0 0 30px rgba(79,110,247,0.25), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <Zap className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">OperaFlow</h1>
          <p className="text-text-secondary text-sm mt-1.5 tracking-wide">
            Gestão Operacional Industrial
          </p>
        </div>

        {/* Card */}
        <Card
          className="bg-card border-border"
          style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-text-primary text-lg font-semibold">Entrar</CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              Use suas credenciais corporativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-text-secondary text-xs uppercase tracking-widest font-medium"
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
                  className="bg-surface border-border text-text-primary placeholder:text-text-muted focus-visible:ring-accent focus-visible:border-accent/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-text-secondary text-xs uppercase tracking-widest font-medium"
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
                  className="bg-surface border-border text-text-primary placeholder:text-text-muted focus-visible:ring-accent focus-visible:border-accent/50 transition-colors"
                />
              </div>

              {error && (
                <div className="animate-fade-in border-l-2 border-danger bg-danger/8 rounded-r-md px-3 py-2">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
                style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(79,110,247,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin-slow w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-text-muted text-xs mt-6">
          OperaFlow · Plataforma Industrial © 2026
        </p>
      </div>
    </div>
  );
}
