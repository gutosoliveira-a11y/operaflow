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
  ) {
    super();
  }

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

    try {
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

      await this.whatsappService.sendReply(remoteJid, reply);
      this.logger.log(`Ticket TK-${ticketNum} created for ${remoteJid}`);
    } catch (err) {
      this.logger.error(`Failed to process message from ${remoteJid}`, err);
      throw err;
    }
  }
}
