import { ApiProperty } from '@nestjs/swagger';

export class SectorResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slaDefaultHours: number;
  @ApiProperty({ nullable: true }) responsibleId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
