import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

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
    this.logger.log(`Processing message directly from ${remoteJid}: "${text.slice(0, 60)}"`);

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
        createdBy: creator.id,
        slaDueDate,
      },
      include: { sector: true, creator: true },
    });

    await this.prisma.whatsappContact.upsert({
      where: { phone: remoteJid },
      create: { phone: remoteJid, name: pushName || remoteJid, lastTicketId: ticket.id },
      update: { name: pushName || remoteJid, lastTicketId: ticket.id },
    });

    this.ticketsGateway.emitTicketCreated(ticket as Record<string, unknown>);

    const ticketNum = ticket.id.slice(0, 8).toUpperCase();
    const reply =
      `✅ Chamado #TK-${ticketNum} aberto!\n` +
      `📁 Setor: ${sector.name}\n` +
      `🔔 Prioridade: Média\n` +
      `⏱️ SLA: ${sector.slaDefaultHours}h`;

    await this.sendReply(remoteJid, reply);
    this.logger.log(`Ticket TK-${ticketNum} created for ${remoteJid}`);
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
