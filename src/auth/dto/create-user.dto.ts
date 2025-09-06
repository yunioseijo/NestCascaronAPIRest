import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass1!',
    minLength: 6,
    maxLength: 50,
    description: 'Must include uppercase, lowercase and number/symbol',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiProperty({ example: 'Ada Lovelace', description: 'Full name' })
  @IsString()
  @MinLength(1)
  fullName: string;
}
