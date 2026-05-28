import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSector = {
  id: 'sector-1',
  name: 'Manutenção',
  slaDefaultHours: 8,
  responsibleId: null,
  responsible: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  sector: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SectorsService', () => {
  let service: SectorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectorsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SectorsService>(SectorsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de setores', async () => {
      mockPrisma.sector.findMany.mockResolvedValue([mockSector]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Manutenção');
    });
  });

  describe('findOne', () => {
    it('deve retornar setor pelo id', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);
      const result = await service.findOne('sector-1');
      expect(result.id).toBe('sector-1');
    });

    it('deve lançar NotFoundException quando setor não existe', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar setor com sucesso', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(null);
      mockPrisma.sector.create.mockResolvedValue(mockSector);
      const result = await service.create({ name: 'Manutenção', slaDefaultHours: 8 });
      expect(result.name).toBe('Manutenção');
    });

    it('deve lançar ConflictException quando nome já existe', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);
      await expect(service.create({ name: 'Manutenção' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deve atualizar setor', async () => {
      mockPrisma.sector.findUnique.mockResolvedValue(mockSector);
      mockPrisma.sector.update.mockResolvedValue({ ...mockSector, slaDefaultHours: 4 });
      const result = await service.update('sector-1', { slaDefaultHours: 4 });
      expect(result.slaDefaultHours).toBe(4);
    });
  });
});
