# Sprint 1 — Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação completa do backend NestJS do OperaFlow com Auth JWT, CRUD de Usuários e CRUD de Setores, pronto para receber os módulos de Tickets e Kanban no Sprint 2.

**Architecture:** Monolito NestJS modular. Cada domínio tem módulo próprio com DTOs validados, Service isolado e Controller REST. Prisma como ORM sobre PostgreSQL (Supabase). JWT stateless para autenticação. Resposta padronizada via Interceptor global.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL, @nestjs/jwt, passport-jwt, bcryptjs, class-validator, @nestjs/swagger, @nestjs/throttler

---

## File Map

```
backend/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
├── prisma/
│   └── schema.prisma
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── common/
    │   ├── filters/
    │   │   └── http-exception.filter.ts
    │   ├── interceptors/
    │   │   └── response.interceptor.ts
    │   ├── decorators/
    │   │   └── roles.decorator.ts
    │   └── guards/
    │       ├── jwt-auth.guard.ts
    │       └── roles.guard.ts
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.service.spec.ts
    │   ├── strategies/
    │   │   └── jwt.strategy.ts
    │   └── dto/
    │       ├── login.dto.ts
    │       └── token-response.dto.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   ├── users.service.spec.ts
    │   └── dto/
    │       ├── create-user.dto.ts
    │       ├── update-user.dto.ts
    │       └── user-response.dto.ts
    └── sectors/
        ├── sectors.module.ts
        ├── sectors.controller.ts
        ├── sectors.service.ts
        ├── sectors.service.spec.ts
        └── dto/
            ├── create-sector.dto.ts
            ├── update-sector.dto.ts
            └── sector-response.dto.ts
```

---

## Task 1: Estrutura do Projeto NestJS

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.env.example`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`

- [ ] **Step 1: Criar pasta backend e package.json**

```json
// backend/package.json
{
  "name": "operaflow-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/config": "^3.2.0",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^5.1.2",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.4.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/passport-jwt": "^4.0.1",
    "jest": "^29.7.0",
    "prisma": "^5.14.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.4.5"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Criar tsconfig.json**

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: Criar tsconfig.build.json**

```json
// backend/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Criar nest-cli.json**

```json
// backend/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: Criar .env.example**

```env
# backend/.env.example
DATABASE_URL="postgresql://user:password@localhost:5432/operaflow?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
```

- [ ] **Step 6: Copiar .env.example para .env e preencher com as credenciais reais do Supabase**

No terminal:
```bash
cd backend
cp .env.example .env
```

Preencher `DATABASE_URL` com a connection string do Supabase (Settings → Database → Connection string → URI).

- [ ] **Step 7: Criar src/main.ts**

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({ origin: process.env.FRONTEND_URL || '*' });

  const config = new DocumentBuilder()
    .setTitle('OperaFlow API')
    .setDescription('Plataforma Inteligente de Gestão Operacional Industrial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`OperaFlow Backend rodando em: http://localhost:${port}/api`);
  console.log(`Swagger em: http://localhost:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 8: Criar src/app.module.ts**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SectorsModule } from './sectors/sectors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SectorsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Instalar dependências**

```bash
cd backend
npm install
```

Aguardar instalação completa. Esperado: `added XXX packages`.

- [ ] **Step 10: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend NestJS com configuração inicial"
```

---

## Task 2: Prisma Schema e Módulo

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`

- [ ] **Step 1: Criar prisma/schema.prisma**

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  operador
  supervisor
  coordenador
  gerente
  administrador
}

enum TicketStatus {
  aberto
  em_andamento
  aguardando
  escalado
  finalizado
  cancelado
}

enum Priority {
  baixa
  media
  alta
  critica
}

enum MessageSource {
  internal
  whatsapp
  system
}

model User {
  id           String  @id @default(cuid())
  name         String
  email        String  @unique
  passwordHash String  @map("password_hash")
  role         Role    @default(operador)
  isActive     Boolean @default(true) @map("is_active")
  sectorId     String? @map("sector_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  sector                Sector?        @relation("UserSector", fields: [sectorId], references: [id])
  responsibleForSectors Sector[]       @relation("SectorResponsible")
  createdTickets        Ticket[]       @relation("TicketCreator")
  responsibleTickets    Ticket[]       @relation("TicketResponsible")
  messages              TicketMessage[]
  notifications         Notification[]

  @@map("users")
}

model Sector {
  id              String  @id @default(cuid())
  name            String  @unique
  slaDefaultHours Int     @default(8) @map("sla_default_hours")
  responsibleId   String? @map("responsible_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  responsible User?       @relation("SectorResponsible", fields: [responsibleId], references: [id])
  users       User[]      @relation("UserSector")
  tickets     Ticket[]
  slaConfigs  SlaConfig[]

  @@map("sectors")
}

model Ticket {
  id              String       @id @default(cuid())
  title           String
  description     String?
  status          TicketStatus @default(aberto)
  priority        Priority     @default(media)
  sectorId        String       @map("sector_id")
  responsibleId   String?      @map("responsible_id")
  createdBy       String       @map("created_by")
  source          String       @default("manual")
  slaDueDate      DateTime?    @map("sla_due_date")
  escalationLevel Int          @default(0) @map("escalation_level")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  closedAt  DateTime? @map("closed_at")

  sector      Sector           @relation(fields: [sectorId], references: [id])
  responsible User?            @relation("TicketResponsible", fields: [responsibleId], references: [id])
  creator     User             @relation("TicketCreator", fields: [createdBy], references: [id])
  messages    TicketMessage[]
  attachments TicketAttachment[]
  escalations Escalation[]

  @@index([status])
  @@index([sectorId])
  @@index([slaDueDate])
  @@map("tickets")
}

model TicketMessage {
  id        String        @id @default(cuid())
  ticketId  String        @map("ticket_id")
  content   String
  authorId  String?       @map("author_id")
  source    MessageSource @default(internal)
  createdAt DateTime      @default(now()) @map("created_at")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author User?  @relation(fields: [authorId], references: [id])

  @@map("ticket_messages")
}

model TicketAttachment {
  id        String   @id @default(cuid())
  ticketId  String   @map("ticket_id")
  filename  String
  url       String
  createdAt DateTime @default(now()) @map("created_at")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@map("ticket_attachments")
}

model Escalation {
  id              String   @id @default(cuid())
  ticketId        String   @map("ticket_id")
  escalationLevel Int      @map("escalation_level")
  escalatedTo     String?  @map("escalated_to")
  reason          String?
  createdAt       DateTime @default(now()) @map("created_at")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@map("escalations")
}

model SlaConfig {
  id         String   @id @default(cuid())
  sectorId   String   @map("sector_id")
  priority   Priority
  hoursLimit Int      @map("hours_limit")
  createdAt  DateTime @default(now()) @map("created_at")

  sector Sector @relation(fields: [sectorId], references: [id], onDelete: Cascade)

  @@unique([sectorId, priority])
  @@map("sla_config")
}

model AiLog {
  id         String   @id @default(cuid())
  rawMessage String   @map("raw_message")
  aiResponse Json     @map("ai_response")
  confidence Float?
  ticketId   String?  @map("ticket_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("ai_logs")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  title     String
  message   String
  type      String   @default("info")
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model WhatsappContact {
  id           String   @id @default(cuid())
  phone        String   @unique
  name         String?
  lastTicketId String?  @map("last_ticket_id")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("whatsapp_contacts")
}
```

- [ ] **Step 2: Criar PrismaService**

```typescript
// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 3: Criar PrismaModule**

```typescript
// backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 4: Executar migration inicial**

```bash
cd backend
npx prisma migrate dev --name init
```

Esperado: `Your database is now in sync with your schema.`
Isso cria as tabelas no Supabase PostgreSQL.

- [ ] **Step 5: Gerar Prisma Client**

```bash
npx prisma generate
```

Esperado: `Generated Prisma Client`.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/ backend/src/prisma/
git commit -m "feat: Prisma schema completo com todos os modelos do MVP"
```

---

## Task 3: Common Infrastructure

**Files:**
- Create: `backend/src/common/filters/http-exception.filter.ts`
- Create: `backend/src/common/interceptors/response.interceptor.ts`
- Create: `backend/src/common/decorators/roles.decorator.ts`
- Create: `backend/src/common/guards/jwt-auth.guard.ts`
- Create: `backend/src/common/guards/roles.guard.ts`

- [ ] **Step 1: Criar HttpExceptionFilter**

```typescript
// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exception.message;

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 2: Criar ResponseInterceptor**

```typescript
// backend/src/common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        data,
        message: 'success',
        statusCode,
      })),
    );
  }
}
```

- [ ] **Step 3: Criar Roles decorator**

```typescript
// backend/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4: Criar JwtAuthGuard**

```typescript
// backend/src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 5: Criar RolesGuard**

```typescript
// backend/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/common/
git commit -m "feat: common infrastructure — exception filter, response interceptor, guards"
```

---

## Task 4: Auth Module (JWT)

**Files:**
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/dto/token-response.dto.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.service.spec.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`

- [ ] **Step 1: Criar LoginDto**

```typescript
// backend/src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
```

- [ ] **Step 2: Criar TokenResponseDto**

```typescript
// backend/src/auth/dto/token-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    sectorId: string | null;
  };
}
```

- [ ] **Step 3: Criar JWT Strategy**

```typescript
// backend/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: { id: true, name: true, email: true, role: true, sectorId: true },
    });

    if (!user) throw new UnauthorizedException('Usuário não encontrado ou inativo');

    return user;
  }
}
```

- [ ] **Step 4: Escrever teste do AuthService (falhar primeiro)**

```typescript
// backend/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar token quando credenciais são válidas', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('senha123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        email: 'joao@empresa.com',
        passwordHash: hash,
        role: 'operador',
        sectorId: null,
        isActive: true,
      });

      const result = await service.login({ email: 'joao@empresa.com', password: 'senha123' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('joao@empresa.com');
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@empresa.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('outrasenha', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        passwordHash: hash,
        isActive: true,
      });

      await expect(
        service.login({ email: 'joao@empresa.com', password: 'senhaerrada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando usuário está inativo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inativo@empresa.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 5: Rodar teste — verificar que FALHA**

```bash
cd backend
npm test auth.service.spec
```

Esperado: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 6: Criar AuthService**

```typescript
// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, isActive: true },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Credenciais inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sectorId: user.sectorId,
      },
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, sectorId: true, isActive: true },
    });
  }
}
```

- [ ] **Step 7: Rodar teste — verificar que PASSA**

```bash
npm test auth.service.spec
```

Esperado: PASS — 4 tests passing

- [ ] **Step 8: Criar AuthController**

```typescript
// backend/src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna perfil do usuário autenticado' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
```

- [ ] **Step 9: Criar AuthModule**

```typescript
// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 10: Commit**

```bash
git add backend/src/auth/
git commit -m "feat: Auth module — JWT login, estratégia passport, /me endpoint"
```

---

## Task 5: Users Module

**Files:**
- Create: `backend/src/users/dto/create-user.dto.ts`
- Create: `backend/src/users/dto/update-user.dto.ts`
- Create: `backend/src/users/dto/user-response.dto.ts`
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/users.service.spec.ts`
- Create: `backend/src/users/users.controller.ts`
- Create: `backend/src/users/users.module.ts`

- [ ] **Step 1: Criar CreateUserDto**

```typescript
// backend/src/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.operador })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'sector-cuid' })
  @IsOptional()
  @IsString()
  sectorId?: string;
}
```

- [ ] **Step 2: Criar UpdateUserDto**

```typescript
// backend/src/users/dto/update-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

- [ ] **Step 3: Criar UserResponseDto**

```typescript
// backend/src/users/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ nullable: true }) sectorId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
```

- [ ] **Step 4: Escrever teste do UsersService (falhar primeiro)**

```typescript
// backend/src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@empresa.com',
  passwordHash: 'hash',
  role: 'operador',
  isActive: true,
  sectorId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de usuários sem passwordHash', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário pelo id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOne('user-1');
      expect(result.id).toBe('user-1');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar usuário e retornar sem passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, name: 'Novo User' });

      const result = await service.create({
        name: 'Novo User',
        email: 'novo@empresa.com',
        password: 'senha123',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando e-mail já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({ name: 'X', email: 'joao@empresa.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'Atualizado' });

      const result = await service.update('user-1', { name: 'Atualizado' });
      expect(result.name).toBe('Atualizado');
    });

    it('deve lançar NotFoundException ao atualizar usuário inexistente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 5: Rodar teste — verificar que FALHA**

```bash
npm test users.service.spec
```

Esperado: FAIL — `Cannot find module './users.service'`

- [ ] **Step 6: Criar UsersService**

```typescript
// backend/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  sectorId: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        sectorId: dto.sectorId,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }
}
```

- [ ] **Step 7: Rodar teste — verificar que PASSA**

```bash
npm test users.service.spec
```

Esperado: PASS — 5 tests passing

- [ ] **Step 8: Criar UsersController**

```typescript
// backend/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.supervisor, Role.coordenador, Role.gerente, Role.administrador)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Desativar usuário (soft delete)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

- [ ] **Step 9: Criar UsersModule**

```typescript
// backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 10: Commit**

```bash
git add backend/src/users/
git commit -m "feat: Users module — CRUD completo com guards de role e soft delete"
```

---

## Task 6: Sectors Module

**Files:**
- Create: `backend/src/sectors/dto/create-sector.dto.ts`
- Create: `backend/src/sectors/dto/update-sector.dto.ts`
- Create: `backend/src/sectors/dto/sector-response.dto.ts`
- Create: `backend/src/sectors/sectors.service.ts`
- Create: `backend/src/sectors/sectors.service.spec.ts`
- Create: `backend/src/sectors/sectors.controller.ts`
- Create: `backend/src/sectors/sectors.module.ts`

- [ ] **Step 1: Criar CreateSectorDto**

```typescript
// backend/src/sectors/dto/create-sector.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Manutenção' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 8, description: 'SLA padrão em horas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaDefaultHours?: number;

  @ApiPropertyOptional({ example: 'user-cuid', description: 'ID do responsável' })
  @IsOptional()
  @IsString()
  responsibleId?: string;
}
```

- [ ] **Step 2: Criar UpdateSectorDto**

```typescript
// backend/src/sectors/dto/update-sector.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSectorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  slaDefaultHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleId?: string;
}
```

- [ ] **Step 3: Criar SectorResponseDto**

```typescript
// backend/src/sectors/dto/sector-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SectorResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slaDefaultHours: number;
  @ApiProperty({ nullable: true }) responsibleId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
```

- [ ] **Step 4: Escrever teste do SectorsService (falhar primeiro)**

```typescript
// backend/src/sectors/sectors.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSector = {
  id: 'sector-1',
  name: 'Manutenção',
  slaDefaultHours: 8,
  responsibleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  sector: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SectorsService', () => {
  let service: SectorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectorsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SectorsService>(SectorsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de setores', async () => {
      mockPrisma.sector.findMany.mockResolvedValue([mockSector]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Manutenção');
    });
  });

  describe('findOne', () => {
    it('deve retornar setor pelo id', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);
      const result = await service.findOne('sector-1');
      expect(result.id).toBe('sector-1');
    });

    it('deve lançar NotFoundException quando setor não existe', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar setor com sucesso', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(null);
      mockPrisma.sector.create.mockResolvedValue(mockSector);

      const result = await service.create({ name: 'Manutenção', slaDefaultHours: 8 });
      expect(result.name).toBe('Manutenção');
    });

    it('deve lançar ConflictException quando nome já existe', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);

      await expect(service.create({ name: 'Manutenção' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deve atualizar setor', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);
      mockPrisma.sector.update.mockResolvedValue({ ...mockSector, slaDefaultHours: 4 });

      const result = await service.update('sector-1', { slaDefaultHours: 4 });
      expect(result.slaDefaultHours).toBe(4);
    });
  });
});
```

- [ ] **Step 5: Rodar teste — verificar que FALHA**

```bash
npm test sectors.service.spec
```

Esperado: FAIL — `Cannot find module './sectors.service'`

- [ ] **Step 6: Criar SectorsService**

```typescript
// backend/src/sectors/sectors.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sector.findMany({
      orderBy: { name: 'asc' },
      include: { responsible: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    const sector = await this.prisma.sector.findUnique({
      where: { id },
      include: { responsible: { select: { id: true, name: true } } },
    });
    if (!sector) throw new NotFoundException(`Setor ${id} não encontrado`);
    return sector;
  }

  async create(dto: CreateSectorDto) {
    const exists = await this.prisma.sector.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Setor com esse nome já existe');

    return this.prisma.sector.create({ data: dto });
  }

  async update(id: string, dto: UpdateSectorDto) {
    await this.findOne(id);
    return this.prisma.sector.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sector.delete({ where: { id } });
  }
}
```

- [ ] **Step 7: Rodar teste — verificar que PASSA**

```bash
npm test sectors.service.spec
```

Esperado: PASS — 5 tests passing

- [ ] **Step 8: Criar SectorsController**

```typescript
// backend/src/sectors/sectors.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Sectors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sectors')
export class SectorsController {
  constructor(private sectorsService: SectorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os setores' })
  findAll() {
    return this.sectorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar setor por ID' })
  findOne(@Param('id') id: string) {
    return this.sectorsService.findOne(id);
  }

  @Post()
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Criar novo setor' })
  create(@Body() dto: CreateSectorDto) {
    return this.sectorsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Atualizar setor' })
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto) {
    return this.sectorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Remover setor' })
  remove(@Param('id') id: string) {
    return this.sectorsService.remove(id);
  }
}
```

- [ ] **Step 9: Criar SectorsModule**

```typescript
// backend/src/sectors/sectors.module.ts
import { Module } from '@nestjs/common';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';

@Module({
  controllers: [SectorsController],
  providers: [SectorsService],
  exports: [SectorsService],
})
export class SectorsModule {}
```

- [ ] **Step 10: Commit**

```bash
git add backend/src/sectors/
git commit -m "feat: Sectors module — CRUD completo com SLA padrão por setor"
```

---

## Task 7: Seed Inicial e Validação Final

**Files:**
- Create: `backend/prisma/seed.ts`

- [ ] **Step 1: Criar seed com admin e setores padrão**

```typescript
// backend/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@operaflow.com';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash,
        role: Role.administrador,
      },
    });
    console.log('✓ Admin criado: admin@operaflow.com / admin123');
  } else {
    console.log('Admin já existe, pulando...');
  }

  const setores = [
    { name: 'Manutenção', slaDefaultHours: 4 },
    { name: 'Produção', slaDefaultHours: 2 },
    { name: 'Qualidade', slaDefaultHours: 8 },
    { name: 'PCP', slaDefaultHours: 24 },
    { name: 'Compras', slaDefaultHours: 48 },
    { name: 'Segurança', slaDefaultHours: 1 },
    { name: 'TI', slaDefaultHours: 8 },
  ];

  for (const setor of setores) {
    await prisma.sector.upsert({
      where: { name: setor.name },
      update: {},
      create: setor,
    });
    console.log(`✓ Setor: ${setor.name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Adicionar script de seed no package.json**

Adicionar dentro de `"scripts"` no `backend/package.json`:
```json
"seed": "ts-node prisma/seed.ts"
```

- [ ] **Step 3: Executar seed**

```bash
cd backend
npm run seed
```

Esperado:
```
✓ Admin criado: admin@operaflow.com / admin123
✓ Setor: Manutenção
✓ Setor: Produção
... (7 setores)
```

- [ ] **Step 4: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passando (auth.service.spec, users.service.spec, sectors.service.spec)

- [ ] **Step 5: Iniciar servidor em modo dev**

```bash
npm run start:dev
```

Esperado: `OperaFlow Backend rodando em: http://localhost:3001/api`

- [ ] **Step 6: Verificar Swagger**

Abrir no browser: `http://localhost:3001/api/docs`

Verificar que aparecem os grupos: Auth, Users, Sectors

- [ ] **Step 7: Teste manual — login**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@operaflow.com","password":"admin123"}'
```

Esperado: JSON com `accessToken` e `user`.

- [ ] **Step 8: Commit final do Sprint 1**

```bash
git add backend/prisma/seed.ts backend/package.json
git commit -m "feat: seed inicial com admin e setores padrão — Sprint 1 backend completo"
```

---

## Checklist de Cobertura do Spec

- [x] Clean Architecture (módulos separados, services isolados)
- [x] SOLID (SRP por arquivo, DI via constructors)
- [x] DTOs com class-validator
- [x] Guards JWT + Roles
- [x] Response padronizado via interceptor
- [x] Exception filter global
- [x] Swagger documentado
- [x] Prisma schema completo (todos os modelos do MVP)
- [x] Testes unitários (auth, users, sectors)
- [x] Seed com dados iniciais
- [x] bcrypt (senha segura, rounds 12)
- [x] .env com todas as vars necessárias

---

## Riscos Técnicos

1. **Supabase connection pooling** — em produção usar `?pgbouncer=true&connection_limit=1` na DATABASE_URL
2. **bcryptjs no Windows** — usamos `bcryptjs` (pure JS) ao invés de `bcrypt` (native bindings) para evitar problemas de compilação
3. **JWT secret em produção** — gerar com `openssl rand -hex 64` e nunca commitar

## Melhorias Futuras (pós-MVP)

- Refresh tokens com rotação
- Rate limiting por usuário autenticado
- Audit log de ações administrativas
- Paginação nos endpoints de listagem
- Filtros avançados (por role, setor, status)
