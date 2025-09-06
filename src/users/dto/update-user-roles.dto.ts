import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidRoles } from '../../auth/interfaces';

export class UpdateUserRolesDto {
  @ApiProperty({ isArray: true, enum: ValidRoles, example: ['admin', 'user'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}
