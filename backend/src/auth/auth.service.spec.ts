import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar token quando credenciais são válidas', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('senha123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        email: 'joao@empresa.com',
        passwordHash: hash,
        role: 'operador',
        sectorId: null,
        isActive: true,
      });

      const result = await service.login({ email: 'joao@empresa.com', password: 'senha123' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('joao@empresa.com');
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@empresa.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('outrasenha', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        passwordHash: hash,
        isActive: true,
      });

      await expect(
        service.login({ email: 'joao@empresa.com', password: 'senhaerrada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando usuário está inativo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inativo@empresa.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
