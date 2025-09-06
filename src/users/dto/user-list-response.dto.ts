import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class UserListResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];
}

