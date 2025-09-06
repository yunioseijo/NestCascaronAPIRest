import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

