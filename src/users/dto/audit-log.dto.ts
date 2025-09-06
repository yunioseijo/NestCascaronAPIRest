import { ApiProperty } from '@nestjs/swagger';

export class AuditLogDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  action: string;
  @ApiProperty({ required: false, nullable: true })
  metadata?: Record<string, any> | null;
  @ApiProperty({ required: false, nullable: true })
  ip?: string | null;
  @ApiProperty({ required: false, nullable: true })
  userAgent?: string | null;
  @ApiProperty()
  createdAt: Date;
}

