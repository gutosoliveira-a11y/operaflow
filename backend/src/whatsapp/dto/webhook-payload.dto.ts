import { IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class WaMessageKeyDto {
  @IsString()
  remoteJid: string;

  @IsString()
  @IsOptional()
  id?: string;
}

export class WaMessageDataDto {
  @IsString()
  @IsOptional()
  conversation?: string;

  @IsObject()
  @IsOptional()
  extendedTextMessage?: { text: string };
}

export class WaMessageDto {
  @ValidateNested()
  @Type(() => WaMessageKeyDto)
  key: WaMessageKeyDto;

  @ValidateNested()
  @Type(() => WaMessageDataDto)
  @IsOptional()
  message?: WaMessageDataDto;

  @IsString()
  @IsOptional()
  pushName?: string;
}

export class WebhookPayloadDto {
  @IsString()
  @IsOptional()
  event?: string;

  @ValidateNested()
  @Type(() => WaMessageDto)
  @IsOptional()
  data?: WaMessageDto;
}
