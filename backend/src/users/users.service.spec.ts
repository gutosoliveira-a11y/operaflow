import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@empresa.com',
  role: 'operador',
  isActive: true,
  sectorId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de usuários', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário pelo id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOne('user-1');
      expect(result.id).toBe('user-1');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar usuário e retornar sem passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, name: 'Novo User' });

      const result = await service.create({ name: 'Novo User', email: 'novo@empresa.com', password: 'senha123' });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('deve lançar ConflictException quando e-mail já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.create({ name: 'X', email: 'joao@empresa.com', password: '123456' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'Atualizado' });

      const result = await service.update('user-1', { name: 'Atualizado' });
      expect(result.name).toBe('Atualizado');
    });

    it('deve lançar NotFoundException ao atualizar usuário inexistente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
});
