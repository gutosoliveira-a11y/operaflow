import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evolution API webhook receiver' })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-webhook-secret') secret: string,
  ) {
    const expected = this.config.get<string>('EVOLUTION_WEBHOOK_SECRET');
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    await this.whatsappService.enqueue(payload);
    return { ok: true };
  }
}
