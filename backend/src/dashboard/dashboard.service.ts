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

  async getReports(period: number) {
    const since = new Date();
    since.setDate(since.getDate() - period);

    const [ticketsBySector, finalized, sectors] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['sectorId'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.finalizado,
          closedAt: { gte: since },
          slaDueDate: { not: null },
        },
        select: { priority: true, slaDueDate: true, closedAt: true, createdAt: true, sectorId: true },
      }),
      this.prisma.sector.findMany({ select: { id: true, name: true } }),
    ]);

    const sectorMap = Object.fromEntries(sectors.map((s) => [s.id, s.name]));

    const byPriority: Record<string, { total: number; sumHours: number }> = {};
    for (const t of finalized) {
      const p = t.priority as string;
      if (!byPriority[p]) byPriority[p] = { total: 0, sumHours: 0 };
      byPriority[p].total += 1;
      byPriority[p].sumHours += (t.closedAt!.getTime() - t.createdAt.getTime()) / 3_600_000;
    }

    const bySectorCompliance: Record<string, { onTime: number; total: number }> = {};
    for (const t of finalized) {
      const s = t.sectorId;
      if (!bySectorCompliance[s]) bySectorCompliance[s] = { onTime: 0, total: 0 };
      bySectorCompliance[s].total += 1;
      if (t.closedAt! <= t.slaDueDate!) bySectorCompliance[s].onTime += 1;
    }

    return {
      period,
      ticketsBySector: ticketsBySector.map((b) => ({
        sectorId: b.sectorId,
        sectorName: sectorMap[b.sectorId] ?? b.sectorId,
        count: b._count.id,
      })),
      avgResolutionByPriority: Object.entries(byPriority).map(([priority, d]) => ({
        priority,
        avgHours: d.total > 0 ? Math.round(d.sumHours / d.total) : 0,
      })),
      slaComplianceBySector: Object.entries(bySectorCompliance).map(([sectorId, d]) => ({
        sectorId,
        sectorName: sectorMap[sectorId] ?? sectorId,
        compliance: d.total > 0 ? Math.round((d.onTime / d.total) * 100) : 100,
      })),
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
