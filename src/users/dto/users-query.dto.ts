import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ValidRoles } from '../../auth/interfaces';

export class UsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term (email, fullName, username, phone)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ValidRoles, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(ValidRoles)
  role?: ValidRoles;

  @ApiPropertyOptional({ description: 'Filter by active status', type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by email verification', type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  emailVerified?: boolean;
}

