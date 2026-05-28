import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

export const WHATSAPP_QUEUE = 'whatsapp-messages';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectQueue(WHATSAPP_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async enqueue(payload: WebhookPayloadDto): Promise<void> {
    if (payload.event !== 'messages.upsert') return;
    const msg = payload.data;
    if (!msg?.key?.remoteJid) return;
    const text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      '';
    if (!text.trim()) return;

    try {
      await this.queue.add('process-message', {
        remoteJid: msg.key.remoteJid,
        text: text.trim(),
        pushName: msg.pushName ?? '',
      });
      this.logger.log(`Enqueued message from ${msg.key.remoteJid}`);
    } catch (err) {
      this.logger.error(`Failed to enqueue message from ${msg.key.remoteJid}`, err);
    }
  }

  async sendReply(remoteJid: string, message: string): Promise<void> {
    const url = this.config.get<string>('EVOLUTION_API_URL');
    const key = this.config.get<string>('EVOLUTION_API_KEY');
    const instance = this.config.get<string>('EVOLUTION_API_INSTANCE');

    try {
      await axios.post(
        `${url}/message/sendText/${instance}`,
        { number: remoteJid, text: message },
        { headers: { apikey: key } },
      );
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp reply to ${remoteJid}`, err);
    }
  }
}
