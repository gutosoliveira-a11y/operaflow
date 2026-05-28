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
