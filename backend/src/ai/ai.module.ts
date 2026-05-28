import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { OpenAIClassifier } from './providers/openai.classifier';
import { AnthropicClassifier } from './providers/anthropic.classifier';
import { GeminiClassifier } from './providers/gemini.classifier';

@Module({
  providers: [AIService, OpenAIClassifier, AnthropicClassifier, GeminiClassifier],
  exports: [AIService],
})
export class AIModule {}
