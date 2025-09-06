import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ required: false, nullable: true })
  username?: string | null;
  @ApiProperty()
  fullName: string;
  @ApiProperty({ required: false, nullable: true })
  firstName?: string | null;
  @ApiProperty({ required: false, nullable: true })
  lastName?: string | null;
  @ApiProperty()
  isActive: boolean;
  @ApiProperty({ type: [String] })
  roles: string[];
  @ApiProperty({ required: false, nullable: true })
  avatarUrl?: string | null;
  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;
  @ApiProperty({ required: false, nullable: true })
  bio?: string | null;
  @ApiProperty({ required: false, nullable: true })
  countryCode?: string | null;
  @ApiProperty({ required: false, nullable: true })
  locale?: string | null;
  @ApiProperty({ required: false, nullable: true })
  timezone?: string | null;
  @ApiProperty()
  emailVerified: boolean;
  @ApiProperty({ required: false, nullable: true })
  emailVerifiedAt?: Date | null;
  @ApiProperty({ required: false, nullable: true })
  lastLoginAt?: Date | null;
  @ApiProperty({ required: false, nullable: true })
  lastLoginIp?: string | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty({ required: false, nullable: true })
  deletedAt?: Date | null;
}

