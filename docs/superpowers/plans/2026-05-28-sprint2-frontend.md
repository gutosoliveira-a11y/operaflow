# Sprint 2B — Frontend: Next.js 15 + Login + Dashboard + Kanban

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o frontend MVP do OperaFlow com Next.js 15: tema dark industrial, login, dashboard com KPIs e Kanban board com drag-and-drop.

**Architecture:** App Router com route groups — `(auth)` para login, `(dashboard)` para páginas protegidas. Zustand gerencia auth state (token + user) via localStorage persist. React Query gerencia server state (API calls). Auth guard no dashboard layout redireciona para `/login` se não autenticado. Todos os componentes interativos são Client Components.

**Tech Stack:** Next.js 15, React 19, TypeScript, TailwindCSS, ShadCN UI, Zustand v5, @tanstack/react-query v5, Axios, @dnd-kit/core + @dnd-kit/sortable, lucide-react

---

## File Map

```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── components.json              # ShadCN config
├── tsconfig.json
├── .env.local
├── .env.local.example
└── src/
    ├── app/
    │   ├── layout.tsx           # Root: html, body, Providers
    │   ├── globals.css          # Tailwind + dark theme tokens
    │   ├── providers.tsx        # Client: QueryClientProvider
    │   ├── page.tsx             # Root redirect client component
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx     # Login form
    │   └── (dashboard)/
    │       ├── layout.tsx       # Auth guard + Sidebar + main
    │       ├── page.tsx         # Dashboard KPIs
    │       └── kanban/
    │           └── page.tsx     # Kanban board
    ├── components/
    │   ├── ui/                  # ShadCN auto-generated (button, card, input, label, badge)
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   └── header.tsx
    │   ├── dashboard/
    │   │   └── kpi-card.tsx
    │   └── kanban/
    │       ├── ticket-card.tsx
    │       ├── kanban-column.tsx
    │       └── kanban-board.tsx
    ├── hooks/
    │   ├── use-dashboard.ts
    │   └── use-kanban.ts
    ├── lib/
    │   ├── api.ts               # Axios instance + auth interceptor + 401 redirect
    │   └── utils.ts             # cn() utility
    ├── stores/
    │   └── auth.store.ts        # Zustand persist: token, user, login(), logout()
    └── types/
        └── index.ts             # Ticket, User, KpiData, ApiResponse, etc.
```

**Pasta raiz do monorepo:** `C:\Users\ekaizen\Downloads\Projeto ClaudeCode`
**Pasta do frontend:** `C:\Users\ekaizen\Downloads\Projeto ClaudeCode\frontend`
**Backend rodando em:** `http://localhost:3001/api`

---

## Task 1: Scaffold Next.js 15 + Dependências + Tailwind + ShadCN

**Files:**
- Create: `frontend/` (via create-next-app)
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Create: `frontend/components.json`
- Create: `frontend/.env.local`
- Create: `frontend/.env.local.example`

- [ ] **Step 1: Criar projeto Next.js 15**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" && npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --no-turbopack
```

Se perguntar interativamente, responder: usar defaults. Aguardar conclusão.

Verificar que a pasta foi criada:
```bash
ls "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend"
```

- [ ] **Step 2: Instalar dependências extras**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npm install axios zustand @tanstack/react-query @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react clsx tailwind-merge class-variance-authority
```

- [ ] **Step 3: Substituir tailwind.config.ts com tema OperaFlow**

```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0B10',
        card: '#10131A',
        surface: '#161B27',
        border: '#1E2535',
        accent: '#4F6EF7',
        success: '#25D366',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Substituir globals.css**

```css
/* frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  background-color: #0A0B10;
  color: #F1F5F9;
}

/* Scrollbar dark */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #10131A; }
::-webkit-scrollbar-thumb { background: #1E2535; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #4F6EF7; }
```

- [ ] **Step 5: Criar components.json para ShadCN**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": false,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 6: Criar src/lib/utils.ts**

```typescript
// frontend/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Adicionar componentes ShadCN**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx shadcn@latest add button card input label badge separator --yes
```

Se falhar com `--yes`, tentar sem a flag e responder `y` aos prompts:
```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx shadcn@latest add button card input label badge separator
```

Verificar que os arquivos foram criados em `src/components/ui/`.

- [ ] **Step 8: Criar .env.local**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

```bash
# frontend/.env.local.example
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 9: Verificar TypeScript compile**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

Esperado: sem erros (ou apenas warnings do Next.js auto-gerado que podem ser ignorados).

- [ ] **Step 10: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: scaffold Next.js 15 frontend — Tailwind dark theme, ShadCN, deps"
```

---

## Task 2: Core Infrastructure (Types + API Client + Auth Store + Providers)

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/stores/auth.store.ts`
- Create: `frontend/src/app/providers.tsx`

- [ ] **Step 1: Criar types/index.ts**

```typescript
// frontend/src/types/index.ts

export type Role = 'operador' | 'supervisor' | 'coordenador' | 'gerente' | 'administrador';
export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando' | 'escalado' | 'finalizado' | 'cancelado';
export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type MessageSource = 'whatsapp' | 'internal' | 'system';
export type TicketSource = 'manual' | 'whatsapp' | 'email' | 'api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  sectorId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  slaDefaultHours: number;
  responsible: { id: string; name: string } | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  authorId: string | null;
  source: MessageSource;
  createdAt: string;
  author: { id: string; name: string } | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  sectorId: string;
  responsibleId: string | null;
  createdBy: string;
  source: TicketSource;
  slaDueDate: string | null;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  sector: { id: string; name: string; slaDefaultHours: number };
  responsible: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string; email: string };
  messages: TicketMessage[];
}

export interface KanbanColumns {
  aberto: Ticket[];
  em_andamento: Ticket[];
  aguardando: Ticket[];
  escalado: Ticket[];
}

export interface KpiData {
  totalOpen: number;
  totalOverdue: number;
  slaCompliance: number;
  avgResolutionHours: number;
  bySector: { sectorId: string; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  byStatus: { status: TicketStatus; count: number }[];
  recentActivity: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
    updatedAt: string;
    sector: { name: string };
  }[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
```

- [ ] **Step 2: Criar lib/api.ts**

```typescript
// frontend/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('operaflow_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { state?: { token?: string } };
        const token = parsed?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore parse errors
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      localStorage.removeItem('operaflow_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3: Criar stores/auth.store.ts**

```typescript
// frontend/src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: 'operaflow_auth' }
  )
);
```

- [ ] **Step 4: Criar app/providers.tsx**

```typescript
// frontend/src/app/providers.tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Substituir app/layout.tsx**

```typescript
// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OperaFlow — Gestão Operacional Industrial',
  description: 'Plataforma inteligente de gestão operacional industrial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/src/types/ frontend/src/lib/api.ts frontend/src/stores/ frontend/src/app/providers.tsx frontend/src/app/layout.tsx
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: core infrastructure — types, API client, auth store (Zustand), QueryClient provider"
```

---

## Task 3: Login Page

**Files:**
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/page.tsx` (root redirect)

- [ ] **Step 1: Criar app/page.tsx (root redirect)**

```typescript
// frontend/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    router.replace(isAuthenticated ? '/kanban' : '/login');
  }, [isAuthenticated, router]);

  return null;
}
```

- [ ] **Step 2: Criar pasta e Login page**

Criar a estrutura de pastas:
```bash
mkdir -p "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend/src/app/(auth)/login"
```

```typescript
// frontend/src/app/(auth)/login/page.tsx
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
        {/* Logo */}
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
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/src/app/page.tsx frontend/src/app/"(auth)"/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: login page — dark industrial design, JWT auth flow"
```

---

## Task 4: Dashboard Layout (Sidebar + Header + Auth Guard)

**Files:**
- Create: `frontend/src/components/layout/sidebar.tsx`
- Create: `frontend/src/components/layout/header.tsx`
- Create: `frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Criar components/layout/sidebar.tsx**

```typescript
// frontend/src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Columns, Ticket, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
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
```

- [ ] **Step 2: Criar components/layout/header.tsx**

```typescript
// frontend/src/components/layout/header.tsx
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
```

- [ ] **Step 3: Criar app/(dashboard)/layout.tsx**

Criar pasta:
```bash
mkdir -p "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend/src/app/(dashboard)"
```

```typescript
// frontend/src/app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

- [ ] **Step 5: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/src/components/layout/ frontend/src/app/"(dashboard)"/layout.tsx
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: dashboard layout — sidebar, header, auth guard client-side"
```

---

## Task 5: Dashboard KPIs Page

**Files:**
- Create: `frontend/src/components/dashboard/kpi-card.tsx`
- Create: `frontend/src/hooks/use-dashboard.ts`
- Create: `frontend/src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Criar components/dashboard/kpi-card.tsx**

```typescript
// frontend/src/components/dashboard/kpi-card.tsx
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber';
  subtitle?: string;
}

const colorMap: Record<string, string> = {
  blue: 'text-info',
  green: 'text-success',
  red: 'text-danger',
  amber: 'text-warning',
};

export function KpiCard({ label, value, icon: Icon, color = 'blue', subtitle }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-secondary text-xs uppercase tracking-widest font-medium">
          {label}
        </p>
        <Icon className={cn('w-5 h-5', colorMap[color])} />
      </div>
      <p className="text-4xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="text-text-muted text-xs mt-2">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Criar hooks/use-dashboard.ts**

```typescript
// frontend/src/hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, KpiData } from '@/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<KpiData>>('/dashboard/kpis');
      return data.data;
    },
    refetchInterval: 30_000,
  });
}
```

- [ ] **Step 3: Criar app/(dashboard)/page.tsx**

```typescript
// frontend/src/app/(dashboard)/page.tsx
'use client';

import { TicketIcon, AlertCircle, Shield, Timer } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useDashboard } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary text-sm">Carregando KPIs...</p>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <p className="text-danger text-sm">Erro ao carregar dados do dashboard.</p>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Chamados Abertos"
                value={data.totalOpen}
                icon={TicketIcon}
                color="blue"
              />
              <KpiCard
                label="Atrasados"
                value={data.totalOverdue}
                icon={AlertCircle}
                color="red"
              />
              <KpiCard
                label="Conformidade SLA"
                value={`${data.slaCompliance}%`}
                icon={Shield}
                color={
                  data.slaCompliance >= 80
                    ? 'green'
                    : data.slaCompliance >= 60
                    ? 'amber'
                    : 'red'
                }
              />
              <KpiCard
                label="Tempo Médio (h)"
                value={data.avgResolutionHours}
                icon={Timer}
                color="blue"
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-widest">
                Atividade Recente
              </h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-text-muted text-sm">Nenhuma atividade recente.</p>
              ) : (
                <div className="space-y-0">
                  {data.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-text-primary text-sm font-medium">{item.title}</p>
                        <p className="text-text-muted text-xs">{item.sector.name}</p>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          item.status === 'aberto' && 'bg-info/20 text-info',
                          item.status === 'em_andamento' && 'bg-success/20 text-success',
                          item.status === 'aguardando' && 'bg-warning/20 text-warning',
                          item.status === 'escalado' && 'bg-danger/20 text-danger',
                          item.status === 'finalizado' && 'bg-surface text-text-secondary',
                          item.status === 'cancelado' && 'bg-surface text-text-muted'
                        )}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

- [ ] **Step 5: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/src/components/dashboard/ frontend/src/hooks/use-dashboard.ts frontend/src/app/"(dashboard)"/page.tsx
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: dashboard KPIs page — 4 metric cards + atividade recente"
```

---

## Task 6: Kanban Board (Drag-and-Drop)

**Files:**
- Create: `frontend/src/components/kanban/ticket-card.tsx`
- Create: `frontend/src/components/kanban/kanban-column.tsx`
- Create: `frontend/src/components/kanban/kanban-board.tsx`
- Create: `frontend/src/hooks/use-kanban.ts`
- Create: `frontend/src/app/(dashboard)/kanban/page.tsx`

- [ ] **Step 1: Criar components/kanban/ticket-card.tsx**

```typescript
// frontend/src/components/kanban/ticket-card.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ticket, Priority } from '@/types';

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  critica: { label: 'CRÍTICA', cls: 'bg-danger/20 text-danger border-danger/30' },
  alta:    { label: 'ALTA',    cls: 'bg-warning/20 text-warning border-warning/30' },
  media:   { label: 'MÉDIA',   cls: 'bg-info/20 text-info border-info/30' },
  baixa:   { label: 'BAIXA',   cls: 'bg-surface text-text-secondary border-border' },
};

function formatSla(slaDueDate: string | null): { text: string; overdue: boolean } {
  if (!slaDueDate) return { text: 'Sem SLA', overdue: false };
  const diffMs = new Date(slaDueDate).getTime() - Date.now();
  if (diffMs < 0) return { text: 'VENCIDO', overdue: true };
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, overdue: false };
}

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const p = priorityConfig[ticket.priority];
  const sla = formatSla(ticket.slaDueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50 shadow-xl ring-1 ring-accent'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', p.cls)}>
          {p.label}
        </span>
        <span className="text-text-muted text-xs font-mono">
          #{ticket.id.slice(-4).toUpperCase()}
        </span>
      </div>

      <p className="text-text-primary text-sm font-medium mb-1 line-clamp-2 leading-snug">
        {ticket.title}
      </p>
      <p className="text-text-secondary text-xs mb-3">{ticket.sector.name}</p>

      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1 text-xs', sla.overdue ? 'text-danger font-semibold' : 'text-text-secondary')}>
          <Clock className="w-3 h-3" />
          <span>{sla.text}</span>
        </div>
        {ticket.responsible && (
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <User className="w-3 h-3" />
            <span>{ticket.responsible.name.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar components/kanban/kanban-column.tsx**

```typescript
// frontend/src/components/kanban/kanban-column.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TicketCard } from './ticket-card';
import type { Ticket, TicketStatus } from '@/types';

const columnConfig: Record<string, { label: string; topColor: string }> = {
  aberto:       { label: 'Aberto',       topColor: 'border-t-info' },
  em_andamento: { label: 'Em Andamento', topColor: 'border-t-success' },
  aguardando:   { label: 'Aguardando',   topColor: 'border-t-warning' },
  escalado:     { label: 'Escalado',     topColor: 'border-t-danger' },
};

interface KanbanColumnProps {
  id: TicketStatus;
  tickets: Ticket[];
}

export function KanbanColumn({ id, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];

  return (
    <div
      className={cn(
        'bg-surface rounded-lg border-t-2 w-64 flex-shrink-0 flex flex-col',
        config.topColor,
        isOver && 'ring-1 ring-accent/50'
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-text-primary text-sm font-semibold">{config.label}</span>
        <span className="bg-border text-text-secondary text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {tickets.length}
        </span>
      </div>

      <div ref={setNodeRef} className="p-2 space-y-2 flex-1 min-h-[400px]">
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-24">
            <p className="text-text-muted text-xs">Nenhum chamado</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar components/kanban/kanban-board.tsx**

```typescript
// frontend/src/components/kanban/kanban-board.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { TicketCard } from './ticket-card';
import type { KanbanColumns, Ticket, TicketStatus } from '@/types';

const COLUMN_IDS: TicketStatus[] = ['aberto', 'em_andamento', 'aguardando', 'escalado'];

interface KanbanBoardProps {
  columns: KanbanColumns;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export function KanbanBoard({ columns, onStatusChange }: KanbanBoardProps) {
  const [local, setLocal] = useState<KanbanColumns>(columns);
  const [active, setActive] = useState<Ticket | null>(null);

  // Sync when server data changes
  useEffect(() => { setLocal(columns); }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function findCol(ticketId: string): TicketStatus | null {
    for (const col of COLUMN_IDS) {
      if (local[col].find((t) => t.id === ticketId)) return col;
    }
    return null;
  }

  function handleDragStart({ active: a }: DragStartEvent) {
    const col = findCol(a.id as string);
    if (col) setActive(local[col].find((t) => t.id === a.id) ?? null);
  }

  function handleDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    const activeId = a.id as string;
    const overId = over.id as string;
    const fromCol = findCol(activeId);
    const toCol: TicketStatus | null = COLUMN_IDS.includes(overId as TicketStatus)
      ? (overId as TicketStatus)
      : findCol(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    setLocal((prev) => {
      const ticket = prev[fromCol].find((t) => t.id === activeId)!;
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t) => t.id !== activeId),
        [toCol]: [...prev[toCol], ticket],
      };
    });
  }

  function handleDragEnd({ active: a, over }: DragEndEvent) {
    setActive(null);
    if (!over) return;
    const activeId = a.id as string;
    const overId = over.id as string;
    const col = findCol(activeId);
    if (!col) return;

    if (COLUMN_IDS.includes(overId as TicketStatus)) {
      // Dropped on column — fire status change
      onStatusChange(activeId, overId as TicketStatus);
    } else if (activeId !== overId) {
      // Reorder within column
      setLocal((prev) => {
        const items = prev[col];
        const oldIdx = items.findIndex((t) => t.id === activeId);
        const newIdx = items.findIndex((t) => t.id === overId);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return { ...prev, [col]: arrayMove(items, oldIdx, newIdx) };
      });
      // Also fire status change if card moved to another column during drag-over
      const destCol = findCol(overId);
      if (destCol && destCol !== col) onStatusChange(activeId, destCol);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_IDS.map((colId) => (
          <KanbanColumn key={colId} id={colId} tickets={local[colId]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <TicketCard ticket={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 4: Criar hooks/use-kanban.ts**

```typescript
// frontend/src/hooks/use-kanban.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, KanbanColumns, TicketStatus } from '@/types';

export function useKanban(sectorId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['kanban', sectorId],
    queryFn: async () => {
      const params = sectorId ? `?sectorId=${sectorId}` : '';
      const { data } = await api.get<ApiResponse<KanbanColumns>>(`/tickets/kanban${params}`);
      return data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      comment,
    }: {
      ticketId: string;
      status: TicketStatus;
      comment?: string;
    }) => {
      const { data } = await api.patch(`/tickets/${ticketId}/status`, { status, comment });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { ...query, updateStatus };
}
```

- [ ] **Step 5: Criar app/(dashboard)/kanban/page.tsx**

```bash
mkdir -p "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend/src/app/(dashboard)/kanban"
```

```typescript
// frontend/src/app/(dashboard)/kanban/page.tsx
'use client';

import { Header } from '@/components/layout/header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { useKanban } from '@/hooks/use-kanban';
import type { TicketStatus } from '@/types';

export default function KanbanPage() {
  const { data, isLoading, error, updateStatus } = useKanban();

  function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    updateStatus.mutate({ ticketId, status: newStatus });
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Kanban" />
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary text-sm">Carregando Kanban...</p>
          </div>
        )}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <p className="text-danger text-sm">Erro ao carregar Kanban.</p>
          </div>
        )}
        {data && <KanbanBoard columns={data} onStatusChange={handleStatusChange} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npx tsc --noEmit 2>&1
```

Esperado: sem erros. Se houver erros de tipo do @dnd-kit (raro), verificar se os imports estão corretos.

- [ ] **Step 7: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add frontend/src/components/kanban/ frontend/src/hooks/use-kanban.ts frontend/src/app/"(dashboard)"/kanban/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: Kanban board — drag-and-drop com @dnd-kit, ticket cards com SLA, 4 colunas"
```

---

## Task 7: Validação Final End-to-End

- [ ] **Step 1: Garantir backend rodando**

O backend deve estar em `http://localhost:3001/api`. Se não estiver:
```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm run start:dev
```

Aguardar: `OperaFlow Backend rodando em: http://localhost:3001/api`

- [ ] **Step 2: Iniciar frontend em background**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npm run dev
```

Aguardar: `▲ Next.js ... ready in ...ms` e `Local: http://localhost:3000`

- [ ] **Step 3: Testar build de produção (TypeScript + Next.js)**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/frontend" && npm run build 2>&1
```

Esperado: `✓ Compiled successfully` sem erros TypeScript.

- [ ] **Step 4: Abrir browser e validar fluxo**

Usar Playwright ou descrever os passos manuais:

1. Navegar para `http://localhost:3000`
2. Deve redirecionar para `/login`
3. Inserir `admin@operaflow.com` / `admin123` → clicar Entrar
4. Deve redirecionar para `/kanban`
5. Kanban deve exibir 4 colunas (Aberto, Em Andamento, Aguardando, Escalado)
6. Navegar para `/` → Dashboard deve mostrar KPIs (totalOpen, conformidade SLA)
7. No Kanban, arrastar um card de "Aberto" para "Em Andamento" → card deve mover + status atualizado no backend

- [ ] **Step 5: Commit final**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add -A
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: Sprint 2B frontend completo — Login, Dashboard KPIs, Kanban drag-and-drop validados"
```

---

## Checklist de Cobertura do Spec

- [x] Tela Login — dark industrial, form email/senha, JWT
- [x] Dashboard — 4 KPI cards (abertos, atrasados, SLA %, tempo médio) + atividade recente
- [x] Kanban — 4 colunas (aberto, em_andamento, aguardando, escalado), drag-and-drop
- [x] Ticket card — prioridade badge, SLA countdown, responsável
- [x] Sidebar — navegação entre Dashboard e Kanban
- [x] Header — nome do usuário + logout
- [x] Auth guard — redireciona /login se não autenticado
- [x] Zustand persist — token salvo no localStorage
- [x] React Query — fetch + cache + invalidação ao mudar status
- [x] Axios interceptor — Authorization header automático + redirect 401

## Riscos Técnicos

1. **ShadCN components.json + cssVariables:false** — usando cores Tailwind diretas ao invés das CSS vars do ShadCN; se `npx shadcn@latest add` sobrescrever globals.css com vars, remover manualmente as vars do ShadCN e manter as cores do tailwind.config.ts
2. **DragOverlay + React 19** — @dnd-kit/core é compatível com React 19 mas `dropAnimation={null}` evita warnings conhecidos durante overlay
3. **Zustand persist hydration** — em SSR/App Router, pode haver flash de tela antes do localStorage ser lido; `if (!isAuthenticated) return null` no layout mitiga isso
4. **create-next-app interativo** — se a versão usada pedir confirmação, aceitar defaults; confirmar com `y` se necessário
