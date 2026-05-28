import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TicketSource } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Máquina 08 parada por falta de pressão' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Pressão hidráulica zerou às 14h30' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.media })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ example: 'sector-cuid' })
  @IsString()
  @IsNotEmpty()
  sectorId: string;

  @ApiPropertyOptional({ example: 'user-cuid' })
  @IsOptional()
  @IsString()
  responsibleId?: string;

  @ApiPropertyOptional({ enum: TicketSource, default: TicketSource.manual })
  @IsOptional()
  @IsEnum(TicketSource)
  source?: TicketSource;
}
