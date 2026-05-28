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
      expect(mockGateway.emitKanbanUpdate).toHaveBeenCalledWith('sector-1');
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
      expect(mockGateway.emitKanbanUpdate).toHaveBeenCalled();
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

    it('deve definir closedAt quando status é cancelado', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.cancelado,
        closedAt: new Date(),
      });
      mockPrisma.ticketMessage.create.mockResolvedValue({});

      await service.updateStatus(
        'ticket-1',
        { status: TicketStatus.cancelado },
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
