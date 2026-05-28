import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService, WHATSAPP_QUEUE, MessageJob } from '../whatsapp.service';

@Processor(WHATSAPP_QUEUE)
@Injectable()
export class WhatsAppMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppMessageProcessor.name);

  constructor(private readonly whatsappService: WhatsAppService) {
    super();
  }

  async process(job: Job<MessageJob>): Promise<void> {
    this.logger.log(`BullMQ job received for ${job.data.remoteJid}`);
    await this.whatsappService.processMessage(job.data);
  }
}
