import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({ description: 'Opaque refresh token', example: 'tokenId.secret' })
  @IsString()
  refreshToken: string;
}

