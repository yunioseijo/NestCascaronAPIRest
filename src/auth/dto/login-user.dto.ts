import { IsEmail, IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Required when 2FA is enabled' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
