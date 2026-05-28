import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService, WHATSAPP_QUEUE } from './whatsapp.service';
import { WhatsAppMessageProcessor } from './processors/whatsapp-message.processor';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: WHATSAPP_QUEUE }),
    AIModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppMessageProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
