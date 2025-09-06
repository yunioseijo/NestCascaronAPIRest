import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Opaque verification token', example: 'userId.secret' })
  @IsString()
  token: string;
}
