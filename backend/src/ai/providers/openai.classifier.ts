import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAIClassifier, ClassificationResult } from '../interfaces/ai-classifier.interface';
import { buildClassificationPrompt, parseClassificationResponse } from '../ai-prompt';

@Injectable()
export class OpenAIClassifier implements IAIClassifier {
  private readonly logger = new Logger(OpenAIClassifier.name);
  private readonly client: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async classify(text: string): Promise<ClassificationResult> {
    if (!this.client) throw new Error('OPENAI_API_KEY não configurada');
    const prompt = buildClassificationPrompt(text);
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 300,
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    this.logger.debug(`OpenAI raw response: ${raw}`);
    return parseClassificationResponse(raw);
  }
}
