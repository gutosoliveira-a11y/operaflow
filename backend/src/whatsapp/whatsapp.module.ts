import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService, WHATSAPP_QUEUE } from './whatsapp.service';
import { WhatsAppMessageProcessor } from './processors/whatsapp-message.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: WHATSAPP_QUEUE }),
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppMessageProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
