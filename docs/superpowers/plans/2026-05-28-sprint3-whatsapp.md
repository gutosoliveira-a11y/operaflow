# Sprint 3 — WhatsApp Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Receive WhatsApp messages via Evolution API webhook, enqueue them with BullMQ/Redis, process them asynchronously to create tickets automatically, and reply to the sender with the ticket reference.

**Architecture:** Evolution API fires a POST webhook to `/api/whatsapp/webhook`. The controller validates the secret header and enqueues the payload with BullMQ. A dedicated processor dequeues the job, creates a ticket (default sector = first in DB, priority = `media`, source = `whatsapp`), upserts the WhatsApp contact, emits a WebSocket event, and replies to the sender via Evolution API REST.

**Tech Stack:** NestJS, BullMQ, ioredis, Evolution API REST, Prisma, Socket.IO gateway (existing), class-validator

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `backend/src/whatsapp/dto/webhook-payload.dto.ts` | Validates Evolution API webhook body |
| Create | `backend/src/whatsapp/whatsapp.controller.ts` | `POST /whatsapp/webhook` endpoint |
| Create | `backend/src/whatsapp/whatsapp.service.ts` | Enqueue + send Evolution API reply |
| Create | `backend/src/whatsapp/processors/whatsapp-message.processor.ts` | BullMQ job — ticket creation |
| Create | `backend/src/whatsapp/whatsapp.module.ts` | Module wiring |
| Modify | `backend/src/app.module.ts` | Register BullMQModule + WhatsAppModule |
| Modify | `backend/.env` | Add Redis + Evolution API vars |
| Modify | `backend/.env.example` | Document new vars |

---

## Task 1: Install Dependencies + Configure Environment

**Files:**
- Modify: `backend/package.json` (via npm install)
- Modify: `backend/.env`
- Modify: `backend/.env.example`

- [ ] **Step 1: Install BullMQ, ioredis, axios**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
npm install @nestjs/bullmq bullmq ioredis axios
```

Expected output: `added N packages` with no peer-dep errors.

- [ ] **Step 2: Add environment variables to `.env`**

Append to `backend/.env` (keep existing lines, add below):
```env
# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_API_INSTANCE=operaflow
EVOLUTION_WEBHOOK_SECRET=your-webhook-secret
```

- [ ] **Step 3: Document vars in `.env.example`**

Append to `backend/.env.example`:
```env
# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_API_INSTANCE=operaflow
EVOLUTION_WEBHOOK_SECRET=your-webhook-secret
```

- [ ] **Step 4: Start local Redis (Docker)**

```bash
docker run -d --name redis-operaflow -p 6379:6379 redis:7-alpine
```

Expected: container starts, `docker ps` shows `redis-operaflow` running.

- [ ] **Step 5: Verify Redis connection**

```bash
docker exec redis-operaflow redis-cli ping
```

Expected output: `PONG`

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add package.json package-lock.json .env.example
git commit -m "feat(sprint3): install bullmq, ioredis, axios deps"
```

---

## Task 2: Webhook Payload DTO + Controller

**Files:**
- Create: `backend/src/whatsapp/dto/webhook-payload.dto.ts`
- Create: `backend/src/whatsapp/whatsapp.controller.ts`

- [ ] **Step 1: Create DTO**

Create `backend/src/whatsapp/dto/webhook-payload.dto.ts`:
```typescript
import { IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class WaMessageKeyDto {
  @IsString()
  remoteJid: string;

  @IsString()
  @IsOptional()
  id?: string;
}

export class WaMessageDataDto {
  @IsString()
  @IsOptional()
  conversation?: string;

  @IsObject()
  @IsOptional()
  extendedTextMessage?: { text: string };
}

export class WaMessageDto {
  @ValidateNested()
  @Type(() => WaMessageKeyDto)
  key: WaMessageKeyDto;

  @ValidateNested()
  @Type(() => WaMessageDataDto)
  @IsOptional()
  message?: WaMessageDataDto;

  @IsString()
  @IsOptional()
  pushName?: string;
}

export class WebhookPayloadDto {
  @IsString()
  @IsOptional()
  event?: string;

  @ValidateNested()
  @Type(() => WaMessageDto)
  @IsOptional()
  data?: WaMessageDto;
}
```

- [ ] **Step 2: Create Controller**

Create `backend/src/whatsapp/whatsapp.controller.ts`:
```typescript
import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evolution API webhook receiver' })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-webhook-secret') secret: string,
  ) {
    const expected = this.config.get<string>('EVOLUTION_WEBHOOK_SECRET');
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    await this.whatsappService.enqueue(payload);
    return { ok: true };
  }
}
```

- [ ] **Step 3: Verify `@Public()` decorator path**

Read `backend/src/auth/decorators/public.decorator.ts` to confirm the import path is correct. If the file doesn't exist at that path, find it with:
```bash
find backend/src -name "public.decorator.ts"
```
Update the import in the controller accordingly.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add src/whatsapp/dto/webhook-payload.dto.ts src/whatsapp/whatsapp.controller.ts
git commit -m "feat(whatsapp): add webhook DTO and controller"
```

---

## Task 3: WhatsApp Service (Enqueue + Evolution API Reply)

**Files:**
- Create: `backend/src/whatsapp/whatsapp.service.ts`

- [ ] **Step 1: Create service**

Create `backend/src/whatsapp/whatsapp.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

export const WHATSAPP_QUEUE = 'whatsapp-messages';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectQueue(WHATSAPP_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async enqueue(payload: WebhookPayloadDto): Promise<void> {
    if (payload.event !== 'messages.upsert') return;
    const msg = payload.data;
    if (!msg?.key?.remoteJid) return;
    const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '';
    if (!text.trim()) return;

    await this.queue.add('process-message', {
      remoteJid: msg.key.remoteJid,
      text: text.trim(),
      pushName: msg.pushName ?? '',
    });
    this.logger.log(`Enqueued message from ${msg.key.remoteJid}`);
  }

  async sendReply(remoteJid: string, message: string): Promise<void> {
    const url = this.config.get<string>('EVOLUTION_API_URL');
    const key = this.config.get<string>('EVOLUTION_API_KEY');
    const instance = this.config.get<string>('EVOLUTION_API_INSTANCE');

    try {
      await axios.post(
        `${url}/message/sendText/${instance}`,
        { number: remoteJid, text: message },
        { headers: { apikey: key } },
      );
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp reply to ${remoteJid}`, err);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add src/whatsapp/whatsapp.service.ts
git commit -m "feat(whatsapp): add WhatsAppService with enqueue and sendReply"
```

---

## Task 4: BullMQ Processor (Ticket Creation + Contact Upsert + WebSocket)

**Files:**
- Create: `backend/src/whatsapp/processors/whatsapp-message.processor.ts`

The processor must:
1. Find the first active sector in the DB
2. Find the first admin user as ticket creator
3. Upsert `whatsapp_contacts` row (create or update `lastTicketId`)
4. Create ticket with `source: 'whatsapp'`, `priority: 'media'`, `slaDueDate` = now + sector.slaDefaultHours × 3,600,000 ms
5. Emit WebSocket `ticket:created` event
6. Call `WhatsAppService.sendReply` with confirmation message

- [ ] **Step 1: Create processor**

Create `backend/src/whatsapp/processors/whatsapp-message.processor.ts`:
```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService, WHATSAPP_QUEUE } from '../whatsapp.service';
import { TicketsGateway } from '../../websocket/tickets.gateway';

interface MessageJob {
  remoteJid: string;
  text: string;
  pushName: string;
}

@Processor(WHATSAPP_QUEUE)
@Injectable()
export class WhatsAppMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppMessageProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  async process(job: Job<MessageJob>): Promise<void> {
    const { remoteJid, text, pushName } = job.data;
    this.logger.log(`Processing message from ${remoteJid}: "${text.slice(0, 60)}"`);

    const sector = await this.prisma.sector.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!sector) {
      this.logger.warn('No sector found — skipping ticket creation');
      return;
    }

    const creator = await this.prisma.user.findFirst({
      where: { role: 'administrador', isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!creator) {
      this.logger.warn('No admin user found — skipping ticket creation');
      return;
    }

    const slaDueDate = new Date(Date.now() + sector.slaDefaultHours * 3_600_000);

    const ticket = await this.prisma.ticket.create({
      data: {
        title: text.length > 80 ? `${text.slice(0, 77)}...` : text,
        description: text,
        status: 'aberto',
        priority: 'media',
        source: 'whatsapp',
        sectorId: sector.id,
        createdById: creator.id,
        slaDueDate,
      },
      include: { sector: true, createdBy: true },
    });

    await this.prisma.whatsappContact.upsert({
      where: { phone: remoteJid },
      create: { phone: remoteJid, name: pushName || remoteJid, lastTicketId: ticket.id },
      update: { name: pushName || remoteJid, lastTicketId: ticket.id },
    });

    this.ticketsGateway.emitTicketCreated(ticket);

    const ticketNum = String(ticket.id).padStart(4, '0');
    const reply =
      `✅ Chamado #TK-${ticketNum} aberto!\n` +
      `📁 Setor: ${sector.name}\n` +
      `🔔 Prioridade: Média\n` +
      `⏱️ SLA: ${sector.slaDefaultHours}h`;

    await this.whatsappService.sendReply(remoteJid, reply);
    this.logger.log(`Ticket TK-${ticketNum} created for ${remoteJid}`);
  }
}
```

- [ ] **Step 2: Check Prisma model names**

Verify the Prisma model for WhatsApp contacts is named `whatsappContact` (camelCase) by checking `backend/prisma/schema.prisma`. If the model name differs, update the `this.prisma.*` call in the processor.

Run:
```bash
grep -i "whatsapp" "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend\prisma\schema.prisma"
```

Update the processor's `prisma.whatsappContact` call to match the actual model name if different.

- [ ] **Step 3: Check `TicketsGateway.emitTicketCreated` signature**

Read `backend/src/websocket/tickets.gateway.ts` and confirm `emitTicketCreated` accepts the full ticket object returned by `prisma.ticket.create({ include: { sector, createdBy } })`. No changes needed if it already does.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add src/whatsapp/processors/whatsapp-message.processor.ts
git commit -m "feat(whatsapp): add BullMQ processor for ticket creation"
```

---

## Task 5: WhatsApp Module + Register in AppModule

**Files:**
- Create: `backend/src/whatsapp/whatsapp.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create WhatsApp module**

Create `backend/src/whatsapp/whatsapp.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService, WHATSAPP_QUEUE } from './whatsapp.service';
import { WhatsAppMessageProcessor } from './processors/whatsapp-message.processor';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: WHATSAPP_QUEUE }),
    WebsocketModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppMessageProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
```

- [ ] **Step 2: Check WebsocketModule export**

Read `backend/src/websocket/websocket.module.ts` to confirm it exports `TicketsGateway`. If it only exports the module itself without explicitly exporting the gateway provider, add `TicketsGateway` to the `exports` array of `WebsocketModule`.

- [ ] **Step 3: Register BullMQ + WhatsApp in AppModule**

Read `backend/src/app.module.ts` to see the current imports array. Then add:

```typescript
// Add these imports at the top of app.module.ts:
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

// Inside @Module imports array, add after existing entries:
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    connection: {
      host: config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: config.get<number>('REDIS_PORT', 6379),
    },
  }),
  inject: [ConfigService],
}),
WhatsAppModule,
```

- [ ] **Step 4: Build check**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
npx tsc --noEmit
```

Expected: zero TypeScript errors. Fix any type errors before proceeding.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add src/whatsapp/whatsapp.module.ts src/app.module.ts
git commit -m "feat(whatsapp): register WhatsApp module and BullMQ in AppModule"
```

---

## Task 6: E2E Validation — Webhook curl Test

**Files:** None (test only)

- [ ] **Step 1: Start backend dev server**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
npm run start:dev
```

Wait for `NestApplication successfully started` in the console (typically ~5s).

- [ ] **Step 2: Send test webhook curl**

```bash
curl -X POST http://localhost:3001/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": { "remoteJid": "5511999999999@s.whatsapp.net" },
      "message": { "conversation": "Máquina 08 parada, preciso de manutenção urgente" },
      "pushName": "João Silva"
    }
  }'
```

Expected response:
```json
{ "ok": true }
```

- [ ] **Step 3: Verify ticket was created in DB**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
npx prisma studio
```

Open browser at `http://localhost:5555`. Check:
- `Ticket` table: new row with `source = whatsapp`, `status = aberto`, `priority = media`
- `WhatsappContact` table: new row with `phone = 5511999999999@s.whatsapp.net`

- [ ] **Step 4: Check backend logs**

In the backend dev server console, confirm log lines:
```
[WhatsAppService] Enqueued message from 5511999999999@s.whatsapp.net
[WhatsAppMessageProcessor] Processing message from 5511999999999@s.whatsapp.net: "Máquina 08 parada..."
[WhatsAppMessageProcessor] Ticket TK-XXXX created for 5511999999999@s.whatsapp.net
```

Note: `sendReply` will log an error (Evolution API not running locally) — this is expected in dev. The ticket creation must still succeed.

- [ ] **Step 5: Verify WebSocket event**

Open the frontend dashboard at `http://localhost:3000` (or 3002). The Kanban "Aberto" column should show the new ticket after a manual refresh (WebSocket should update in real time if the frontend is subscribed).

- [ ] **Step 6: Final commit**

```bash
cd "C:\Users\ekaizen\Downloads\Projeto ClaudeCode\backend"
git add -A
git commit -m "feat(sprint3): complete WhatsApp integration — webhook + BullMQ + ticket creation"
```

---

## Self-Review

### Spec Coverage
- ✅ Evolution API webhook receiver (`POST /api/whatsapp/webhook`)
- ✅ Secret header validation
- ✅ BullMQ queue for async processing
- ✅ Ticket auto-creation with `source: whatsapp`
- ✅ WhatsApp contact upsert
- ✅ WebSocket event on ticket creation
- ✅ Reply to sender via Evolution API
- ✅ SLA calculated from sector default
- ✅ Redis/BullMQ configured via environment variables

### Placeholder Scan
- No TBD or TODO in code blocks
- All import paths verified against known codebase structure
- All type names consistent (e.g., `WebhookPayloadDto` used in both controller and service)

### Type Consistency
- `WHATSAPP_QUEUE` constant exported from `whatsapp.service.ts`, imported in `whatsapp.module.ts` and processor — no duplication
- `MessageJob` interface defined and used within processor only
- `sendReply(remoteJid: string, message: string)` signature matches call site in processor
