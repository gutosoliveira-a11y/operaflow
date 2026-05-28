import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus, MessageSource, Priority, TicketSource } from '@prisma/client';
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
        source: dto.source ?? TicketSource.manual,
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
    if ((CLOSED_STATUSES as TicketStatus[]).includes(dto.status)) {
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
    return this.updateStatus(
      id,
      { status: TicketStatus.cancelado, comment: 'Ticket cancelado' },
      userId,
    );
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
