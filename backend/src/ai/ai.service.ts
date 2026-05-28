import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { IAIClassifier, ClassificationResult } from './interfaces/ai-classifier.interface';
import { OpenAIClassifier } from './providers/openai.classifier';
import { AnthropicClassifier } from './providers/anthropic.classifier';
import { GeminiClassifier } from './providers/gemini.classifier';

@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);
  private classifier: IAIClassifier;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIClassifier,
    private readonly anthropic: AnthropicClassifier,
    private readonly gemini: GeminiClassifier,
  ) {}

  onModuleInit() {
    const provider = this.config.get<string>('AI_PROVIDER', 'openai').toLowerCase();
    switch (provider) {
      case 'anthropic':
        this.classifier = this.anthropic;
        break;
      case 'gemini':
        this.classifier = this.gemini;
        break;
      default:
        this.classifier = this.openai;
    }
    this.logger.log(`AI provider active: ${provider}`);
  }

  async classify(text: string, ticketId?: string): Promise<ClassificationResult> {
    const result = await this.classifier.classify(text);

    try {
      await this.prisma.aiLog.create({
        data: {
          rawMessage: text,
          aiResponse: result as object,
          confidence: null,
          ticketId: ticketId ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to persist AiLog: ${(err as Error).message}`);
    }

    return result;
  }

  async resolveSectorId(sectorCode: string): Promise<string | null> {
    const nameMap: Record<string, string> = {
      manutencao: 'Manutenção',
      producao: 'Produção',
      qualidade: 'Qualidade',
      pcp: 'PCP',
      compras: 'Compras',
      seguranca: 'Segurança',
      ti: 'TI',
    };
    const displayName = nameMap[sectorCode];
    if (!displayName) return null;

    const sector = await this.prisma.sector.findFirst({
      where: { name: { contains: displayName, mode: 'insensitive' } },
    });
    return sector?.id ?? null;
  }
}
