import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIClassifier, ClassificationResult } from '../interfaces/ai-classifier.interface';
import { buildClassificationPrompt, parseClassificationResponse } from '../ai-prompt';

@Injectable()
export class GeminiClassifier implements IAIClassifier {
  private readonly logger = new Logger(GeminiClassifier.name);
  private readonly client: GoogleGenerativeAI | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
  }

  async classify(text: string): Promise<ClassificationResult> {
    if (!this.client) throw new Error('GEMINI_API_KEY não configurada');
    const prompt = buildClassificationPrompt(text);
    const generativeModel = this.client.getGenerativeModel({ model: this.model });
    const result = await generativeModel.generateContent(prompt);
    const raw = result.response?.text() ?? '';
    if (!raw) throw new Error('Gemini returned empty response');
    this.logger.debug(`Gemini raw response: ${raw}`);
    return parseClassificationResponse(raw);
  }
}
