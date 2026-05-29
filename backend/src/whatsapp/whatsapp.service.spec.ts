import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService, WHATSAPP_QUEUE, MessageJob } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from '../websocket/tickets.gateway';
import { AIService } from '../ai/ai.service';
import { getQueueToken } from '@nestjs/bullmq';

jest.mock('axios', () => ({
  default: {
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

const mockQueue = { add: jest.fn() };

const mockConfig = { get: jest.fn((key: string) => `mock-${key}`) };

const mockPrisma = {
  sector: { findFirst: jest.fn(), findUnique: jest.fn() },
  user: { findFirst: jest.fn() },
  ticket: { create: jest.fn() },
  aiLog: { updateMany: jest.fn() },
  whatsappContact: { upsert: jest.fn() },
};

const mockGateway = { emitTicketCreated: jest.fn(), emitKanbanUpdate: jest.fn() };

const mockAIService = {
  classify: jest.fn(),
  resolveSectorId: jest.fn(),
};

const mockSector = { id: 'sector-1', name: 'TI', slaDefaultHours: 24, createdAt: new Date() };
const mockAdmin = { id: 'admin-1', role: 'administrador', isActive: true };
const mockTicket = {
  id: 'ticket-abc123',
  title: 'Problema urgente',
  priority: 'media',
  status: 'aberto',
  sector: mockSector,
  creator: mockAdmin,
};

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: getQueueToken(WHATSAPP_QUEUE), useValue: mockQueue },
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TicketsGateway, useValue: mockGateway },
        { provide: AIService, useValue: mockAIService },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    jest.clearAllMocks();

    // Defaults
    mockPrisma.sector.findFirst.mockResolvedValue(mockSector);
    mockPrisma.user.findFirst.mockResolvedValue(mockAdmin);
    mockPrisma.ticket.create.mockResolvedValue(mockTicket);
    mockPrisma.aiLog.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.whatsappContact.upsert.mockResolvedValue({});
  });

  describe('processMessage', () => {
    const baseJob: MessageJob = { remoteJid: '5511999990000', text: 'Prensa parada linha 3', pushName: 'João' };

    it('deve criar ticket com prioridade da IA quando classificação bem-sucedida', async () => {
      mockAIService.classify.mockResolvedValue({
        setor: 'manutencao',
        prioridade: 'alta',
        urgencia: 'alta',
        tipo: 'parada_maquina',
        sla_horas: 4,
        maquina: 'Prensa L3',
        op: null,
        justificativa: 'Parada de equipamento crítico',
      });
      mockAIService.resolveSectorId.mockResolvedValue('sector-manutencao');
      mockPrisma.sector.findUnique.mockResolvedValue({ id: 'sector-manutencao', name: 'Manutenção', slaDefaultHours: 4 });

      await service.processMessage(baseJob);

      expect(mockAIService.classify).toHaveBeenCalledWith(baseJob.text);
      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: 'alta', source: 'whatsapp' }),
        }),
      );
    });

    it('deve usar prioridade "media" como fallback quando IA falha', async () => {
      mockAIService.classify.mockRejectedValue(new Error('OpenAI timeout'));

      await service.processMessage(baseJob);

      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: 'media' }),
        }),
      );
    });

    it('deve usar primeiro setor como fallback quando IA não resolve setor', async () => {
      mockAIService.classify.mockResolvedValue({
        setor: 'inexistente', prioridade: 'baixa', urgencia: 'baixa',
        tipo: 'outros', sla_horas: 48, maquina: null, op: null, justificativa: '',
      });
      mockAIService.resolveSectorId.mockResolvedValue(null);

      await service.processMessage(baseJob);

      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sectorId: mockSector.id }),
        }),
      );
    });

    it('não deve criar ticket quando nenhum setor existe', async () => {
      mockPrisma.sector.findFirst.mockResolvedValue(null);

      await service.processMessage(baseJob);

      expect(mockPrisma.ticket.create).not.toHaveBeenCalled();
    });
  });

  describe('enqueue', () => {
    it('deve enfileirar a mensagem no BullMQ quando Redis disponível', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      const payload = {
        event: 'messages.upsert',
        data: {
          key: { remoteJid: '5511999990001' },
          message: { conversation: 'Problema na linha 2' },
          pushName: 'Maria',
        },
      } as any;

      await service.enqueue(payload);

      expect(mockQueue.add).toHaveBeenCalledWith('process-message', expect.objectContaining({
        remoteJid: '5511999990001',
        text: 'Problema na linha 2',
      }));
    });

    it('deve processar diretamente quando Redis indisponível (fallback)', async () => {
      mockQueue.add.mockRejectedValue(new Error('Redis connection refused'));
      mockAIService.classify.mockRejectedValue(new Error('AI offline'));

      const payload = {
        event: 'messages.upsert',
        data: {
          key: { remoteJid: '5511888880001' },
          message: { conversation: 'Equipamento com falha' },
          pushName: 'Pedro',
        },
      } as any;

      await service.enqueue(payload);

      expect(mockPrisma.ticket.create).toHaveBeenCalled();
    });

    it('deve ignorar eventos que não são messages.upsert', async () => {
      const payload = { event: 'connection.update', data: {} } as any;

      await service.enqueue(payload);

      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(mockPrisma.ticket.create).not.toHaveBeenCalled();
    });
  });

  describe('sendReply', () => {
    it('deve chamar axios.post com a URL da Evolution API', async () => {
      const axios = require('axios');
      axios.default.post.mockResolvedValue({ data: {} });

      await service.sendReply('5511999990000@s.whatsapp.net', 'Chamado aberto!');

      expect(axios.default.post).toHaveBeenCalledWith(
        expect.stringContaining('/message/sendText/'),
        expect.objectContaining({ text: 'Chamado aberto!' }),
        expect.objectContaining({ headers: expect.objectContaining({ apikey: expect.any(String) }) }),
      );
    });
  });
});
