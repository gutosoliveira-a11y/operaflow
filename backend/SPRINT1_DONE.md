# Sprint 1 — Backend Foundation ✅ COMPLETO

Data: 2026-05-27

## O que foi entregue

### Infraestrutura
- [x] Projeto NestJS 10 configurado com TypeScript strict
- [x] Swagger em `/api/docs`
- [x] ValidationPipe global (whitelist + forbidNonWhitelisted)
- [x] Exception filter global (resposta padronizada em erros)
- [x] Response interceptor global (envelope `{ data, message, statusCode }`)
- [x] Rate limiting global (ThrottlerModule)
- [x] CORS configurado

### Banco de Dados
- [x] Prisma schema com 11 modelos completos
- [x] 6 enums (Role, TicketStatus, Priority, MessageSource, TicketSource, NotificationType)
- [x] FKs com `onDelete` adequado em todas as relações
- [x] Índices de performance em campos consultados frequentemente
- [x] Seed com admin padrão e 7 setores industriais

### Autenticação
- [x] JWT stateless com `@nestjs/jwt` + `passport-jwt`
- [x] Login via `POST /api/auth/login`
- [x] Perfil do usuário via `GET /api/auth/me` (protegido)
- [x] Guard de roles hierárquico (`RolesGuard`)
- [x] Senha com bcrypt (rounds 12)

### Módulo Usuários
- [x] `GET /api/users` — listar (supervisor+)
- [x] `GET /api/users/:id` — buscar por ID (autenticado)
- [x] `POST /api/users` — criar (admin)
- [x] `PATCH /api/users/:id` — atualizar (admin)
- [x] `DELETE /api/users/:id` — soft delete (admin)
- [x] passwordHash nunca exposto nas respostas

### Módulo Setores
- [x] `GET /api/sectors` — listar (autenticado)
- [x] `GET /api/sectors/:id` — buscar (autenticado)
- [x] `POST /api/sectors` — criar (admin)
- [x] `PATCH /api/sectors/:id` — atualizar (admin)
- [x] `DELETE /api/sectors/:id` — remover (admin)

### Testes
- [x] 17 testes unitários passando
- [x] AuthService: 4 testes
- [x] UsersService: 7 testes
- [x] SectorsService: 6 testes

## Próximos passos (usuário)

### Configurar banco de dados antes do Sprint 2

1. Copiar `.env.example` para `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Preencher `DATABASE_URL` com a connection string do Supabase:
   - Supabase Dashboard → Settings → Database → Connection string → URI

3. Executar migration:
   ```bash
   cd backend && npx prisma migrate dev --name init
   ```

4. Executar seed:
   ```bash
   cd backend && npm run seed
   ```

5. Iniciar servidor:
   ```bash
   cd backend && npm run start:dev
   ```

6. Acessar Swagger: http://localhost:3001/api/docs

## Sprint 2 — O que vem a seguir

- Módulo Tickets (CRUD + status + prioridade + timeline)
- Kanban com drag and drop e Socket.IO em tempo real
- Dashboard com KPIs e gráficos
