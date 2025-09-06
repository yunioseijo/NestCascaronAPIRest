import { ApiProperty } from '@nestjs/swagger';
import { AuditLogDto } from './audit-log.dto';

export class AuditListResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty({ type: [AuditLogDto] })
  data: AuditLogDto[];
}

