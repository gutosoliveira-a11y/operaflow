import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Manutenção' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 8, description: 'SLA padrão em horas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaDefaultHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleId?: string;
}
