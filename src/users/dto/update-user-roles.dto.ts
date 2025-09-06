import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { ValidRoles } from '../../auth/interfaces';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}

