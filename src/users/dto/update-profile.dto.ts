import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_\.\-]+$/)
  username?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

