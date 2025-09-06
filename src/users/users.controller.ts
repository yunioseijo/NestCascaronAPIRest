import { Controller, Get, Patch, Param, Delete, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';
import { UserResponseDto } from './dto/user-response.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { AuditListResponseDto } from './dto/audit-list-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Me endpoints
  @Get('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@GetUser() user: User) {
    return user;
  }

  @Patch('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(@GetUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(id, dto);
  }

  @Patch('me/password')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (requires current password)' })
  changeMyPassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(id, dto);
  }

  // Admin endpoints
  @Get()
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users (admin/super-user)' })
  @ApiOkResponse({ type: UserListResponseDto })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (admin/super-user)' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user fields (admin/super-user)' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/roles')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user roles (admin/super-user)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.usersService.updateRoles(id, dto);
  }

  @Patch(':id/status')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/Deactivate user (admin/super-user)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete user (admin/super-user)' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Patch(':id/restore')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore soft-deleted user (admin/super-user)' })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Get(':id/audit')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user audit logs (admin/super-user)' })
  @ApiOkResponse({ type: AuditListResponseDto })
  getAudit(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.usersService.getAuditLogs(id, pagination);
  }
}
