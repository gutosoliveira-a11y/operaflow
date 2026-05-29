import { Test } from '@nestjs/testing';
import { SlaService } from './sla.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';

const mockPrisma = {
  ticket: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  escalation: {
    create: jest.fn(),
  },
  notification: {
    createMany: jest.fn(),
  },
};

const mockGateway = {
  emitKanbanUpdate: jest.fn(),
  emitTicketCreated: jest.fn(),
};

describe('SlaService', () => {
  let service: SlaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SlaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TicketsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<SlaService>(SlaService);
    jest.clearAllMocks();
  });

  describe('runCheck', () => {
    it('deve processar tickets com SLA vencido e disparar escalonamento nível 1', async () => {
      const now = new Date();
      const overdue = new Date(now.getTime() - 30 * 60_000); // 30 min atrás

      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: 'ticket-1',
          title: 'Prensa parada',
          sectorId: 'sector-1',
          responsibleId: 'user-1',
          escalationLevel: 0,
          slaDueDate: overdue,
          createdAt: new Date(now.getTime() - 4 * 3_600_000),
          sector: { id: 'sector-1', name: 'Manutenção' },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.ticket.update.mockResolvedValue({});
      mockPrisma.escalation.create.mockResolvedValue({});
      mockPrisma.notification.createMany.mockResolvedValue({ count: 0 });

      await service.runCheck();

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ slaDueDate: { not: null } }),
        }),
      );
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { escalationLevel: 1 } }),
      );
    });

    it('não deve disparar escalonamento quando não há tickets com SLA vencido', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await service.runCheck();

      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
      expect(mockPrisma.escalation.create).not.toHaveBeenCalled();
    });

    it('deve emitir update do kanban quando SLA está 75% consumido', async () => {
      const now = new Date();
      const created = new Date(now.getTime() - 3 * 3_600_000); // criado há 3h
      const due = new Date(now.getTime() + 0.8 * 3_600_000);   // vence em 48min → ~79% consumido

      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: 'ticket-2',
          sectorId: 'sector-1',
          responsibleId: null,
          escalationLevel: 0,
          slaDueDate: due,
          createdAt: created,
          sector: { id: 'sector-1', name: 'TI' },
        },
      ]);

      await service.runCheck();

      expect(mockGateway.emitKanbanUpdate).toHaveBeenCalled();
    });

    it('deve escalar para nível 2 quando SLA vencido há mais de 1 hora', async () => {
      const now = new Date();
      const overdue = new Date(now.getTime() - 90 * 60_000); // 90 min atrás

      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: 'ticket-3',
          sectorId: 'sector-1',
          responsibleId: 'user-1',
          escalationLevel: 1,
          slaDueDate: overdue,
          createdAt: new Date(now.getTime() - 8 * 3_600_000),
          sector: { id: 'sector-1', name: 'Manutenção' },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'coord-1' }]);
      mockPrisma.ticket.update.mockResolvedValue({});
      mockPrisma.escalation.create.mockResolvedValue({});
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

      await service.runCheck();

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ escalationLevel: 2, status: 'escalado' }) }),
      );
    });

    it('deve escalar para nível 3 quando SLA vencido há mais de 4 horas', async () => {
      const now = new Date();
      const overdue = new Date(now.getTime() - 5 * 3_600_000); // 5h atrás

      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: 'ticket-4',
          sectorId: 'sector-1',
          responsibleId: 'user-1',
          escalationLevel: 2,
          slaDueDate: overdue,
          createdAt: new Date(now.getTime() - 10 * 3_600_000),
          sector: { id: 'sector-1', name: 'Produção' },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'manager-1' }]);
      mockPrisma.ticket.update.mockResolvedValue({});
      mockPrisma.escalation.create.mockResolvedValue({});
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

      await service.runCheck();

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ escalationLevel: 3 }) }),
      );
    });
  });
});
