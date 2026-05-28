import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIClassifier, ClassificationResult } from '../interfaces/ai-classifier.interface';
import { buildClassificationPrompt, parseClassificationResponse } from '../ai-prompt';

@Injectable()
export class GeminiClassifier implements IAIClassifier {
  private readonly logger = new Logger(GeminiClassifier.name);
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY', ''));
    this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
  }

  async classify(text: string): Promise<ClassificationResult> {
    const prompt = buildClassificationPrompt(text);
    const generativeModel = this.client.getGenerativeModel({ model: this.model });
    const result = await generativeModel.generateContent(prompt);
    const raw = result.response.text();
    this.logger.debug(`Gemini raw response: ${raw}`);
    return parseClassificationResponse(raw);
  }
}
