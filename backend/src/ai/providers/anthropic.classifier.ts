import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { IAIClassifier, ClassificationResult } from '../interfaces/ai-classifier.interface';
import { buildClassificationPrompt, parseClassificationResponse } from '../ai-prompt';

@Injectable()
export class AnthropicClassifier implements IAIClassifier {
  private readonly logger = new Logger(AnthropicClassifier.name);
  private readonly client: Anthropic | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
    this.model = this.config.get<string>('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001');
  }

  async classify(text: string): Promise<ClassificationResult> {
    const prompt = buildClassificationPrompt(text);
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    if (!this.client) throw new Error('ANTHROPIC_API_KEY não configurada');
    const block = response.content[0];
    if (!block || block.type !== 'text') {
      throw new Error('Anthropic returned no text content');
    }
    const raw = block.text;
    this.logger.debug(`Anthropic raw response: ${raw}`);
    return parseClassificationResponse(raw);
  }
}
