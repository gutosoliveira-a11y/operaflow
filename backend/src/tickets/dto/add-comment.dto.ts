import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ example: 'Técnico deslocado para verificação' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
