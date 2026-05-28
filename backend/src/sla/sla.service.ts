import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';

const ONE_HOUR_MS = 3_600_000;
const FOUR_HOURS_MS = 4 * ONE_HOUR_MS;

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TicketsGateway,
  ) {}

  async runCheck(): Promise<void> {
    const now = new Date();

    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: { notIn: ['finalizado', 'cancelado'] },
        slaDueDate: { not: null },
      },
      include: { sector: true },
    });

    this.logger.log(`SLA check: evaluating ${tickets.length} active tickets`);

    for (const ticket of tickets) {
      const due = ticket.slaDueDate!;
      const totalMs = due.getTime() - ticket.createdAt.getTime();
      const elapsedMs = now.getTime() - ticket.createdAt.getTime();
      const overdueMs = now.getTime() - due.getTime();
      const pctConsumed = totalMs > 0 ? elapsedMs / totalMs : 1;

      // 75% consumed warning (WebSocket only)
      if (pctConsumed >= 0.75 && pctConsumed < 1.0 && ticket.escalationLevel === 0) {
        this.gateway.emitKanbanUpdate();
        this.logger.debug(`Ticket ${ticket.id}: SLA 75% consumed`);
      }

      if (overdueMs > 0 && ticket.escalationLevel === 0) {
        await this.escalateToLevel1(ticket.id, ticket.sectorId, ticket.responsibleId);
      }

      if (overdueMs >= ONE_HOUR_MS && ticket.escalationLevel < 2) {
        await this.escalateToLevel2(ticket.id, ticket.sectorId);
      }

      if (overdueMs >= FOUR_HOURS_MS && ticket.escalationLevel < 3) {
        await this.escalateToLevel3(ticket.id);
      }
    }
  }

  private async escalateToLevel1(
    ticketId: string,
    sectorId: string,
    responsibleId: string | null,
  ): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { escalationLevel: 1 },
    });

    const supervisors = await this.prisma.user.findMany({
      where: { role: { in: ['supervisor', 'coordenador'] }, isActive: true, sectorId },
      take: 5,
    });

    const targetIds = [...new Set([
      ...supervisors.map((u) => u.id),
      ...(responsibleId ? [responsibleId] : []),
    ])];

    await this.createNotifications(
      targetIds,
      ticketId,
      'sla_breach',
      'SLA Vencido',
      'Um chamado sob sua responsabilidade ultrapassou o prazo SLA.',
    );

    await this.prisma.escalation.create({
      data: { ticketId, escalationLevel: 1, reason: 'SLA vencido' },
    });

    this.logger.log(`Ticket ${ticketId}: escalated to level 1`);
  }

  private async escalateToLevel2(ticketId: string, sectorId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { escalationLevel: 2, status: 'escalado' },
    });

    const coordinators = await this.prisma.user.findMany({
      where: { role: 'coordenador', isActive: true },
      take: 3,
    });

    await this.createNotifications(
      coordinators.map((u) => u.id),
      ticketId,
      'escalation',
      'Chamado Escalado — Nível 2',
      'Um chamado foi escalado para o nível de coordenação por SLA +1h.',
    );

    if (coordinators.length > 0) {
      await this.prisma.escalation.create({
        data: {
          ticketId,
          escalationLevel: 2,
          escalatedTo: coordinators[0].id,
          reason: 'SLA vencido há mais de 1 hora',
        },
      });
    }

    this.gateway.emitKanbanUpdate();
    this.logger.log(`Ticket ${ticketId}: escalated to level 2`);
  }

  private async escalateToLevel3(ticketId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { escalationLevel: 3 },
    });

    const managers = await this.prisma.user.findMany({
      where: { role: 'gerente', isActive: true },
      take: 3,
    });

    await this.createNotifications(
      managers.map((u) => u.id),
      ticketId,
      'escalation',
      'Chamado Crítico — Nível 3',
      'Um chamado foi escalado para gerência por SLA +4h sem resolução.',
    );

    if (managers.length > 0) {
      await this.prisma.escalation.create({
        data: {
          ticketId,
          escalationLevel: 3,
          escalatedTo: managers[0].id,
          reason: 'SLA vencido há mais de 4 horas',
        },
      });
    }

    this.logger.log(`Ticket ${ticketId}: escalated to level 3`);
  }

  private async createNotifications(
    userIds: string[],
    _ticketId: string,
    type: 'sla_breach' | 'escalation',
    title: string,
    message: string,
  ): Promise<void> {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, message, type })),
      skipDuplicates: true,
    });
  }
}
