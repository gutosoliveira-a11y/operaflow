import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    sectorId: string | null;
  };
}
