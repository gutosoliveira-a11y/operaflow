import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';
import { AIService } from '../ai/ai.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Priority } from '@prisma/client';

export const WHATSAPP_QUEUE = 'whatsapp-messages';

export interface MessageJob {
  remoteJid: string;
  text: string;
  pushName: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectQueue(WHATSAPP_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ticketsGateway: TicketsGateway,
    private readonly aiService: AIService,
  ) {}

  async enqueue(payload: WebhookPayloadDto): Promise<void> {
    if (payload.event !== 'messages.upsert') return;
    const msg = payload.data;
    if (!msg?.key?.remoteJid) return;
    const text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      '';
    if (!text.trim()) return;

    const job: MessageJob = {
      remoteJid: msg.key.remoteJid,
      text: text.trim(),
      pushName: msg.pushName ?? '',
    };

    try {
      await this.queue.add('process-message', job);
      this.logger.log(`Enqueued message from ${msg.key.remoteJid}`);
    } catch (err) {
      this.logger.warn(
        `Queue unavailable (${(err as Error).message}) — processing message directly`,
      );
      await this.processMessage(job);
    }
  }

  async processMessage(job: MessageJob): Promise<void> {
    const { remoteJid, text, pushName } = job;
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

    // AI classification with fallback to defaults
    let priority: Priority = Priority.media;
    let resolvedSectorId = sector.id;
    let aiSlaHours = sector.slaDefaultHours;
    let aiSectorName = sector.name;

    try {
      const classification = await this.aiService.classify(text);
      priority = classification.prioridade as Priority;

      const aiSectorId = await this.aiService.resolveSectorId(classification.setor);
      if (aiSectorId) {
        resolvedSectorId = aiSectorId;
        const resolvedSector = await this.prisma.sector.findUnique({ where: { id: aiSectorId } });
        if (resolvedSector) aiSectorName = resolvedSector.name;
      }

      if (classification.sla_horas > 0) aiSlaHours = classification.sla_horas;

      this.logger.log(
        `AI: setor=${classification.setor}, prioridade=${priority}, sla=${aiSlaHours}h`,
      );
    } catch (err) {
      this.logger.warn(`AI classification failed, using defaults: ${(err as Error).message}`);
    }

    const slaDueDate = new Date(Date.now() + aiSlaHours * 3_600_000);

    try {
      const ticket = await this.prisma.ticket.create({
        data: {
          title: text.length > 80 ? `${text.slice(0, 77)}...` : text,
          description: text,
          status: 'aberto',
          priority,
          source: 'whatsapp',
          sectorId: resolvedSectorId,
          createdBy: creator.id,
          slaDueDate,
        },
        include: { sector: true, creator: true },
      });

      // Link AiLog to ticket (best-effort)
      await this.prisma.aiLog
        .updateMany({
          where: { ticketId: null, rawMessage: text },
          data: { ticketId: ticket.id },
        })
        .catch(() => {});

      await this.prisma.whatsappContact.upsert({
        where: { phone: remoteJid },
        create: { phone: remoteJid, name: pushName || remoteJid, lastTicketId: ticket.id },
        update: { name: pushName || remoteJid, lastTicketId: ticket.id },
      });

      this.ticketsGateway.emitTicketCreated(ticket as Record<string, unknown>);

      const ticketNum = ticket.id.slice(0, 8).toUpperCase();
      const priorityLabel: Record<string, string> = {
        baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
      };
      const reply =
        `✅ Chamado #TK-${ticketNum} aberto!\n` +
        `📁 Setor: ${aiSectorName}\n` +
        `🔔 Prioridade: ${priorityLabel[priority] ?? priority}\n` +
        `⏱️ SLA: ${aiSlaHours}h`;

      await this.sendReply(remoteJid, reply);
      this.logger.log(`Ticket TK-${ticketNum} created for ${remoteJid} (priority: ${priority})`);
    } catch (err) {
      this.logger.error(`Failed to create ticket for ${remoteJid}`, err);
      throw err;
    }
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
