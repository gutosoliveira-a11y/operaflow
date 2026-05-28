# Sprint 2A — Backend: Tickets + WebSocket + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o núcleo operacional do OperaFlow: módulo de Tickets com CRUD completo e transições de status, Gateway WebSocket para Kanban em tempo real, e módulo de Dashboard com KPIs industriais.

**Architecture:** TicketsModule é o coração do sistema — depende de PrismaService e TicketsGateway. O WebSocket Gateway (Socket.IO) emite eventos em tempo real para o frontend a cada mudança de ticket. DashboardModule executa queries Prisma agregadas para KPIs e é read-only. SLA é calculado no momento da criação do ticket consultando SlaConfig ou o slaDefaultHours do setor.

**Tech Stack:** NestJS 10, Prisma 5, Socket.IO (@nestjs/websockets), class-validator, Jest

---

## File Map

```
backend/src/
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   ├── tickets.service.spec.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       ├── update-ticket.dto.ts
│       ├── update-ticket-status.dto.ts
│       ├── add-comment.dto.ts
│       └── filter-tickets.dto.ts
├── websocket/
│   ├── websocket.module.ts
│   └── tickets.gateway.ts
└── dashboard/
    ├── dashboard.module.ts
    ├── dashboard.controller.ts
    ├── dashboard.service.ts
    └── dashboard.service.spec.ts
```

**Modificar:**
- `backend/src/app.module.ts` — adicionar TicketsModule, WebsocketModule, DashboardModule

---

## Task 1: DTOs do módulo Tickets

**Files:**
- Create: `backend/src/tickets/dto/create-ticket.dto.ts`
- Create: `backend/src/tickets/dto/update-ticket.dto.ts`
- Create: `backend/src/tickets/dto/update-ticket-status.dto.ts`
- Create: `backend/src/tickets/dto/add-comment.dto.ts`
- Create: `backend/src/tickets/dto/filter-tickets.dto.ts`

- [ ] **Step 1: Criar CreateTicketDto**

```typescript
// backend/src/tickets/dto/create-ticket.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TicketSource } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Máquina 08 parada por falta de pressão' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Pressão hidráulica zerou às 14h30' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.media })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ example: 'sector-cuid' })
  @IsString()
  @IsNotEmpty()
  sectorId: string;

  @ApiPropertyOptional({ example: 'user-cuid' })
  @IsOptional()
  @IsString()
  responsibleId?: string;

  @ApiPropertyOptional({ enum: TicketSource, default: TicketSource.manual })
  @IsOptional()
  @IsEnum(TicketSource)
  source?: TicketSource;
}
```

- [ ] **Step 2: Criar UpdateTicketDto**

```typescript
// backend/src/tickets/dto/update-ticket.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleId?: string;
}
```

- [ ] **Step 3: Criar UpdateTicketStatusDto**

```typescript
// backend/src/tickets/dto/update-ticket-status.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;

  @ApiPropertyOptional({ example: 'Aguardando peça de reposição' })
  @IsOptional()
  @IsString()
  comment?: string;
}
```

- [ ] **Step 4: Criar AddCommentDto**

```typescript
// backend/src/tickets/dto/add-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ example: 'Técnico deslocado para verificação' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

- [ ] **Step 5: Criar FilterTicketsDto**

```typescript
// backend/src/tickets/dto/filter-tickets.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterTicketsDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

- [ ] **Step 6: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add backend/src/tickets/dto/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: Tickets DTOs — create, update, status, comment, filter"
```

---

## Task 2: WebSocket Gateway

**Files:**
- Create: `backend/src/websocket/tickets.gateway.ts`
- Create: `backend/src/websocket/websocket.module.ts`

- [ ] **Step 1: Instalar dependência do Socket.IO**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm install @nestjs/websockets @nestjs/platform-socket.io socket.io 2>&1
```

Esperado: `added X packages`

- [ ] **Step 2: Criar TicketsGateway**

```typescript
// backend/src/websocket/tickets.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tickets',
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  emitTicketCreated(ticket: Record<string, unknown>) {
    this.server.emit('ticket:created', ticket);
  }

  emitTicketUpdated(ticket: Record<string, unknown>) {
    this.server.emit('ticket:updated', ticket);
  }

  emitStatusChanged(data: { ticketId: string; oldStatus: string; newStatus: string }) {
    this.server.emit('ticket:status_changed', data);
  }

  emitKanbanUpdate(sectorId?: string) {
    this.server.emit('kanban:update', { sectorId });
  }
}
```

- [ ] **Step 3: Criar WebsocketModule**

```typescript
// backend/src/websocket/websocket.module.ts
import { Global, Module } from '@nestjs/common';
import { TicketsGateway } from './tickets.gateway';

@Global()
@Module({
  providers: [TicketsGateway],
  exports: [TicketsGateway],
})
export class WebsocketModule {}
```

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add backend/src/websocket/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: WebSocket Gateway Socket.IO para eventos em tempo real do Kanban"
```

---

## Task 3: Tickets Service (TDD)

**Files:**
- Create: `backend/src/tickets/tickets.service.spec.ts`
- Create: `backend/src/tickets/tickets.service.ts`

- [ ] **Step 1: Escrever testes do TicketsService (falhar primeiro)**

```typescript
// backend/src/tickets/tickets.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TicketStatus, Priority, TicketSource, MessageSource } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';

const mockTicket = {
  id: 'ticket-1',
  title: 'Máquina 08 parada',
  description: 'Sem pressão hidráulica',
  status: TicketStatus.aberto,
  priority: Priority.alta,
  sectorId: 'sector-1',
  responsibleId: null,
  createdBy: 'user-1',
  source: TicketSource.manual,
  slaDueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
  escalationLevel: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
  sector: { id: 'sector-1', name: 'Manutenção', slaDefaultHours: 4 },
  responsible: null,
  creator: { id: 'user-1', name: 'João', email: 'joao@empresa.com' },
  messages: [],
};

const mockPrisma = {
  ticket: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  ticketMessage: {
    create: jest.fn(),
  },
  slaConfig: {
    findUnique: jest.fn(),
  },
  sector: {
    findUnique: jest.fn(),
  },
};

const mockGateway = {
  emitTicketCreated: jest.fn(),
  emitTicketUpdated: jest.fn(),
  emitStatusChanged: jest.fn(),
  emitKanbanUpdate: jest.fn(),
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TicketsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de tickets', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Máquina 08 parada');
    });

    it('deve filtrar por status', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      await service.findAll({ status: TicketStatus.aberto });
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TicketStatus.aberto }),
        }),
      );
    });

    it('deve filtrar por setor', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      await service.findAll({ sectorId: 'sector-2' });
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sectorId: 'sector-2' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar ticket com mensagens', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      const result = await service.findOne('ticket-1');
      expect(result.id).toBe('ticket-1');
    });

    it('deve lançar NotFoundException para ticket inexistente', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar ticket com SLA baseado em SlaConfig', async () => {
      mockPrisma.slaConfig.findUnique.mockResolvedValue({ hoursLimit: 2 });
      mockPrisma.ticket.create.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue({});

      const result = await service.create(
        { title: 'Máquina 08 parada', sectorId: 'sector-1', priority: Priority.alta },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Máquina 08 parada',
            createdBy: 'user-1',
          }),
        }),
      );
      expect(mockGateway.emitTicketCreated).toHaveBeenCalled();
    });

    it('deve usar slaDefaultHours do setor quando SlaConfig não existe', async () => {
      mockPrisma.slaConfig.findUnique.mockResolvedValue(null);
      mockPrisma.sector.findUnique.mockResolvedValue({ slaDefaultHours: 8 });
      mockPrisma.ticket.create.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue({});

      await service.create(
        { title: 'Teste', sectorId: 'sector-1', priority: Priority.media },
        'user-1',
      );

      expect(mockPrisma.sector.findUnique).toHaveBeenCalledWith({
        where: { id: 'sector-1' },
        select: { slaDefaultHours: true },
      });
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status e adicionar mensagem na timeline', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.em_andamento,
      });
      mockPrisma.ticketMessage.create.mockResolvedValue({});

      const result = await service.updateStatus(
        'ticket-1',
        { status: TicketStatus.em_andamento, comment: 'Iniciando atendimento' },
        'user-1',
      );

      expect(result.status).toBe(TicketStatus.em_andamento);
      expect(mockPrisma.ticketMessage.create).toHaveBeenCalled();
      expect(mockGateway.emitStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({ ticketId: 'ticket-1' }),
      );
    });

    it('deve definir closedAt quando status é finalizado', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.finalizado,
        closedAt: new Date(),
      });
      mockPrisma.ticketMessage.create.mockResolvedValue({});

      await service.updateStatus(
        'ticket-1',
        { status: TicketStatus.finalizado },
        'user-1',
      );

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ closedAt: expect.any(Date) }),
        }),
      );
    });

    it('deve lançar NotFoundException para ticket inexistente', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('nao-existe', { status: TicketStatus.em_andamento }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('deve adicionar comentário interno ao ticket', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue({
        id: 'msg-1',
        ticketId: 'ticket-1',
        content: 'Técnico a caminho',
        authorId: 'user-1',
        source: MessageSource.internal,
        createdAt: new Date(),
      });

      const result = await service.addComment('ticket-1', { content: 'Técnico a caminho' }, 'user-1');
      expect(result.content).toBe('Técnico a caminho');
      expect(result.source).toBe(MessageSource.internal);
    });
  });
});
```

- [ ] **Step 2: Rodar testes — verificar que FALHAM**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="tickets.service.spec" 2>&1
```

Esperado: FAIL — `Cannot find module './tickets.service'`

- [ ] **Step 3: Criar TicketsService**

```typescript
// backend/src/tickets/tickets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus, MessageSource, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';

const TICKET_INCLUDE = {
  sector: { select: { id: true, name: true, slaDefaultHours: true } },
  responsible: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: { id: true, name: true } } },
  },
};

const CLOSED_STATUSES = [TicketStatus.finalizado, TicketStatus.cancelado];

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private gateway: TicketsGateway,
  ) {}

  async findAll(filter: FilterTicketsDto) {
    const where: Record<string, unknown> = {};

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.sectorId) where.sectorId = filter.sectorId;
    if (filter.responsibleId) where.responsibleId = filter.responsibleId;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findKanban(sectorId?: string) {
    const where: Record<string, unknown> = {
      status: { notIn: CLOSED_STATUSES },
    };
    if (sectorId) where.sectorId = sectorId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        sector: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { slaDueDate: 'asc' }],
    });

    const columns: Record<string, typeof tickets> = {
      aberto: [],
      em_andamento: [],
      aguardando: [],
      escalado: [],
    };

    for (const ticket of tickets) {
      if (columns[ticket.status] !== undefined) {
        columns[ticket.status].push(ticket);
      }
    }

    return columns;
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} não encontrado`);
    return ticket;
  }

  async create(dto: CreateTicketDto, userId: string) {
    const slaDueDate = await this.calculateSlaDate(dto.sectorId, dto.priority ?? Priority.media);

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? Priority.media,
        sectorId: dto.sectorId,
        responsibleId: dto.responsibleId,
        createdBy: userId,
        source: dto.source ?? 'manual',
        slaDueDate,
      },
      include: TICKET_INCLUDE,
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: `Ticket criado por ${ticket.creator.name}`,
        authorId: userId,
        source: MessageSource.system,
      },
    });

    this.gateway.emitTicketCreated(ticket as unknown as Record<string, unknown>);
    this.gateway.emitKanbanUpdate(dto.sectorId);

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: TICKET_INCLUDE,
    });

    this.gateway.emitTicketUpdated(ticket as unknown as Record<string, unknown>);
    return ticket;
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto, userId: string) {
    const current = await this.findOne(id);
    const oldStatus = current.status;

    const data: Record<string, unknown> = { status: dto.status };
    if (CLOSED_STATUSES.includes(dto.status)) {
      data.closedAt = new Date();
    }

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data,
      include: TICKET_INCLUDE,
    });

    const content = dto.comment
      ? `Status alterado de ${oldStatus} para ${dto.status}: ${dto.comment}`
      : `Status alterado de ${oldStatus} para ${dto.status}`;

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content,
        authorId: userId,
        source: MessageSource.system,
      },
    });

    this.gateway.emitStatusChanged({ ticketId: id, oldStatus, newStatus: dto.status });
    this.gateway.emitKanbanUpdate(current.sectorId);

    return ticket;
  }

  async addComment(id: string, dto: AddCommentDto, userId: string) {
    await this.findOne(id);

    return this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: dto.content,
        authorId: userId,
        source: MessageSource.internal,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, userId: string) {
    return this.updateStatus(id, { status: TicketStatus.cancelado, comment: 'Ticket cancelado' }, userId);
  }

  private async calculateSlaDate(sectorId: string, priority: Priority): Promise<Date> {
    const slaConfig = await this.prisma.slaConfig.findUnique({
      where: { sectorId_priority: { sectorId, priority } },
    });

    let hours = slaConfig?.hoursLimit;

    if (!hours) {
      const sector = await this.prisma.sector.findUnique({
        where: { id: sectorId },
        select: { slaDefaultHours: true },
      });
      hours = sector?.slaDefaultHours ?? 8;
    }

    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
}
```

- [ ] **Step 4: Rodar testes — verificar que PASSAM**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="tickets.service.spec" 2>&1
```

Esperado: PASS — 9 tests passing

- [ ] **Step 5: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add backend/src/tickets/tickets.service.ts backend/src/tickets/tickets.service.spec.ts
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: TicketsService — CRUD, status, SLA, timeline, WebSocket events (TDD)"
```

---

## Task 4: Tickets Controller + Module

**Files:**
- Create: `backend/src/tickets/tickets.controller.ts`
- Create: `backend/src/tickets/tickets.module.ts`

- [ ] **Step 1: Criar TicketsController**

```typescript
// backend/src/tickets/tickets.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Priority, TicketStatus } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { id: string; email: string; role: string; sectorId: string | null };
}

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tickets com filtros' })
  @ApiQuery({ name: 'status', enum: TicketStatus, required: false })
  @ApiQuery({ name: 'priority', enum: Priority, required: false })
  @ApiQuery({ name: 'sectorId', required: false })
  @ApiQuery({ name: 'responsibleId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() filter: FilterTicketsDto) {
    return this.ticketsService.findAll(filter);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Tickets agrupados por status para o Kanban' })
  @ApiQuery({ name: 'sectorId', required: false })
  findKanban(@Query('sectorId') sectorId?: string) {
    return this.ticketsService.findKanban(sectorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ticket por ID com timeline completa' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo ticket manualmente' })
  create(@Body() dto: CreateTicketDto, @Request() req: AuthenticatedRequest) {
    return this.ticketsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar campos do ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status do ticket (registra na timeline)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.updateStatus(id, dto, req.user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Adicionar comentário interno ao ticket' })
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.addComment(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar ticket (soft delete via status)' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.ticketsService.remove(id, req.user.id);
  }
}
```

- [ ] **Step 2: Criar TicketsModule**

```typescript
// backend/src/tickets/tickets.module.ts
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
```

- [ ] **Step 3: Atualizar AppModule**

Leia `backend/src/app.module.ts` e adicione os novos imports:

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SectorsModule } from './sectors/sectors.module';
import { WebsocketModule } from './websocket/websocket.module';
import { TicketsModule } from './tickets/tickets.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    SectorsModule,
    TicketsModule,
    DashboardModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Rodar todos os testes para checar regressões**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="service.spec" 2>&1
```

Esperado: todos passando (auth, users, sectors, tickets)

- [ ] **Step 5: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add backend/src/tickets/tickets.controller.ts backend/src/tickets/tickets.module.ts backend/src/app.module.ts
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: TicketsController REST + TicketsModule + AppModule atualizado"
```

---

## Task 5: Dashboard Module (KPIs)

**Files:**
- Create: `backend/src/dashboard/dashboard.service.spec.ts`
- Create: `backend/src/dashboard/dashboard.service.ts`
- Create: `backend/src/dashboard/dashboard.controller.ts`
- Create: `backend/src/dashboard/dashboard.module.ts`

- [ ] **Step 1: Escrever testes do DashboardService (falhar primeiro)**

```typescript
// backend/src/dashboard/dashboard.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  ticket: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getKpis', () => {
    it('deve retornar KPIs com estrutura correta', async () => {
      mockPrisma.ticket.count.mockResolvedValue(10);
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      mockPrisma.ticket.groupBy.mockResolvedValue([]);

      const result = await service.getKpis();

      expect(result).toHaveProperty('totalOpen');
      expect(result).toHaveProperty('totalOverdue');
      expect(result).toHaveProperty('slaCompliance');
      expect(result).toHaveProperty('avgResolutionHours');
      expect(result).toHaveProperty('bySector');
      expect(result).toHaveProperty('byPriority');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('recentActivity');
    });

    it('deve retornar slaCompliance 100 quando não há tickets finalizados', async () => {
      mockPrisma.ticket.count.mockResolvedValue(0);
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      mockPrisma.ticket.groupBy.mockResolvedValue([]);

      const result = await service.getKpis();
      expect(result.slaCompliance).toBe(100);
    });

    it('deve calcular slaCompliance corretamente', async () => {
      mockPrisma.ticket.count.mockResolvedValue(5);
      // 2 tickets: 1 no prazo, 1 atrasado
      const slaDue = new Date(Date.now() + 1000);
      const closedOnTime = new Date(slaDue.getTime() - 1000);
      const closedLate = new Date(slaDue.getTime() + 1000);
      mockPrisma.ticket.findMany.mockResolvedValueOnce([
        { slaDueDate: slaDue, closedAt: closedOnTime, createdAt: new Date(Date.now() - 7200000) },
        { slaDueDate: slaDue, closedAt: closedLate, createdAt: new Date(Date.now() - 7200000) },
      ]).mockResolvedValue([]);
      mockPrisma.ticket.groupBy.mockResolvedValue([]);

      const result = await service.getKpis();
      expect(result.slaCompliance).toBe(50);
    });
  });
});
```

- [ ] **Step 2: Rodar teste — verificar que FALHA**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="dashboard.service.spec" 2>&1
```

Esperado: FAIL — `Cannot find module './dashboard.service'`

- [ ] **Step 3: Criar DashboardService**

```typescript
// backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const OPEN_STATUSES = [
  TicketStatus.aberto,
  TicketStatus.em_andamento,
  TicketStatus.aguardando,
  TicketStatus.escalado,
];

const CLOSED_STATUSES = [TicketStatus.finalizado, TicketStatus.cancelado];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const now = new Date();

    const [totalOpen, totalOverdue, bySector, byPriority, byStatus, finalized, recentActivity] =
      await Promise.all([
        this.prisma.ticket.count({ where: { status: { in: OPEN_STATUSES } } }),

        this.prisma.ticket.count({
          where: {
            status: { notIn: CLOSED_STATUSES },
            slaDueDate: { lt: now },
          },
        }),

        this.prisma.ticket.groupBy({
          by: ['sectorId'],
          where: { status: { notIn: CLOSED_STATUSES } },
          _count: { id: true },
        }),

        this.prisma.ticket.groupBy({
          by: ['priority'],
          _count: { id: true },
        }),

        this.prisma.ticket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        this.prisma.ticket.findMany({
          where: {
            status: TicketStatus.finalizado,
            slaDueDate: { not: null },
            closedAt: { not: null },
          },
          select: { slaDueDate: true, closedAt: true, createdAt: true },
        }),

        this.prisma.ticket.findMany({
          where: { status: { notIn: [] } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            updatedAt: true,
            sector: { select: { name: true } },
          },
        }),
      ]);

    const slaCompliance = this.calculateSlaCompliance(finalized);
    const avgResolutionHours = this.calculateAvgResolution(finalized);

    return {
      totalOpen,
      totalOverdue,
      slaCompliance,
      avgResolutionHours,
      bySector: bySector.map((b) => ({ sectorId: b.sectorId, count: b._count.id })),
      byPriority: byPriority.map((b) => ({ priority: b.priority, count: b._count.id })),
      byStatus: byStatus.map((b) => ({ status: b.status, count: b._count.id })),
      recentActivity,
    };
  }

  private calculateSlaCompliance(
    tickets: { slaDueDate: Date | null; closedAt: Date | null }[],
  ): number {
    if (tickets.length === 0) return 100;
    const onTime = tickets.filter(
      (t) => t.closedAt !== null && t.slaDueDate !== null && t.closedAt <= t.slaDueDate,
    ).length;
    return Math.round((onTime / tickets.length) * 100);
  }

  private calculateAvgResolution(
    tickets: { createdAt: Date; closedAt: Date | null }[],
  ): number {
    const resolved = tickets.filter((t) => t.closedAt !== null);
    if (resolved.length === 0) return 0;
    const totalHours = resolved.reduce((sum, t) => {
      const hours = (t.closedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    return Math.round(totalHours / resolved.length);
  }
}
```

- [ ] **Step 4: Rodar teste — verificar que PASSA**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="dashboard.service.spec" 2>&1
```

Esperado: PASS — 3 tests passing

- [ ] **Step 5: Criar DashboardController**

```typescript
// backend/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs operacionais em tempo real' })
  getKpis() {
    return this.dashboardService.getKpis();
  }
}
```

- [ ] **Step 6: Criar DashboardModule**

```typescript
// backend/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
```

- [ ] **Step 7: Rodar todos os testes**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm test -- --testPathPattern="service.spec" 2>&1
```

Esperado: todos passando (auth, users, sectors, tickets, dashboard)

- [ ] **Step 8: Verificar TypeScript**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npx tsc --noEmit 2>&1
```

Esperado: sem erros

- [ ] **Step 9: Commit**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add backend/src/dashboard/
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: Dashboard Module — KPIs, SLA compliance, tempo médio de resolução"
```

---

## Task 6: Validação Final Backend Sprint 2

- [ ] **Step 1: Reiniciar servidor (se estiver rodando em outro terminal, usar este)**

```bash
cd "C:/Users/ekaizen/Downloads/Projeto ClaudeCode/backend" && npm run start:dev 2>&1
```

Aguardar: `OperaFlow Backend rodando em: http://localhost:3001/api`

- [ ] **Step 2: Testar login e pegar token**

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@operaflow.com\",\"password\":\"admin123\"}" 2>&1
```

Copiar o `accessToken` da resposta.

- [ ] **Step 3: Testar criação de ticket**

Substituir `SEU_TOKEN` pelo token do passo anterior:

```bash
curl -s -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d "{\"title\":\"Máquina 08 parada\",\"sectorId\":\"ID_DO_SETOR_MANUTENCAO\",\"priority\":\"alta\"}" 2>&1
```

Para pegar o ID do setor de Manutenção:
```bash
curl -s http://localhost:3001/api/sectors -H "Authorization: Bearer SEU_TOKEN" 2>&1
```

- [ ] **Step 4: Testar endpoint do Kanban**

```bash
curl -s http://localhost:3001/api/tickets/kanban \
  -H "Authorization: Bearer SEU_TOKEN" 2>&1
```

Esperado: `{ data: { aberto: [...], em_andamento: [], aguardando: [], escalado: [] } }`

- [ ] **Step 5: Testar KPIs do Dashboard**

```bash
curl -s http://localhost:3001/api/dashboard/kpis \
  -H "Authorization: Bearer SEU_TOKEN" 2>&1
```

Esperado: `{ data: { totalOpen: 1, totalOverdue: 0, slaCompliance: 100, ... } }`

- [ ] **Step 6: Commit final**

```bash
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" add -A
git -C "C:/Users/ekaizen/Downloads/Projeto ClaudeCode" commit -m "feat: Sprint 2A backend completo — Tickets, WebSocket, Dashboard validados"
```

---

## Checklist de Cobertura do Spec

- [x] Criar ticket manual (`POST /api/tickets`)
- [x] Listar tickets com filtros (`GET /api/tickets`)
- [x] Kanban agrupado por status (`GET /api/tickets/kanban`)
- [x] Detalhe do ticket com timeline (`GET /api/tickets/:id`)
- [x] Alterar status com registro na timeline (`PATCH /api/tickets/:id/status`)
- [x] Adicionar comentário interno (`POST /api/tickets/:id/comments`)
- [x] Cancelar ticket (`DELETE /api/tickets/:id`)
- [x] SLA calculado automaticamente (SlaConfig ou slaDefaultHours do setor)
- [x] Eventos WebSocket: ticket:created, ticket:updated, ticket:status_changed, kanban:update
- [x] KPIs: totalOpen, totalOverdue, slaCompliance, avgResolutionHours, bySector, byPriority, byStatus
- [x] Testes unitários com TDD (tickets + dashboard)

## Riscos Técnicos

1. **Socket.IO CORS em produção** — configurar `origin` com a URL real do frontend antes do deploy
2. **groupBy com sectorId** — retorna sectorId mas não o nome do setor; o frontend precisará mapear usando a lista de setores
3. **Prisma connection pool** — com Socket.IO + muitos clientes conectados, monitorar limite de conexões do Supabase Free (max ~60 conexões diretas)
