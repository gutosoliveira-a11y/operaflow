import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WaExtendedTextDto {
  @IsString()
  @IsOptional()
  text?: string;
}

export class WaMessageKeyDto {
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @IsString()
  @IsOptional()
  id?: string;
}

export class WaMessageDataDto {
  @IsString()
  @IsOptional()
  conversation?: string;

  @ValidateNested()
  @Type(() => WaExtendedTextDto)
  @IsOptional()
  extendedTextMessage?: WaExtendedTextDto;
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
