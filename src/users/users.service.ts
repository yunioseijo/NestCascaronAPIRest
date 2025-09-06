import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../auth/entities/user.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const [data, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { total, data };
  }

  async findOneById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOneById(id);
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return user;
  }

  async softDelete(id: string) {
    await this.findOneById(id);
    await this.userRepository.softDelete(id);
    return { id, deleted: true };
  }

  async restore(id: string) {
    await this.userRepository.restore(id);
    return { id, restored: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findOneById(userId);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = bcrypt.compareSync(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const newHash = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepository.update(userId, { password: newHash });
    await this.auditLogRepository.save({
      user: { id: userId } as User,
      action: 'password_change',
      metadata: {},
    });
    return { ok: true };
  }

  async updateRoles(id: string, dto: UpdateUserRolesDto) {
    const user = await this.findOneById(id);
    user.roles = dto.roles;
    await this.userRepository.save(user);
    await this.auditLogRepository.save({
      user: { id } as User,
      action: 'roles_update',
      metadata: { roles: dto.roles },
    });
    return user;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.findOneById(id);
    user.isActive = dto.isActive;
    await this.userRepository.save(user);
    await this.auditLogRepository.save({
      user: { id } as User,
      action: 'status_update',
      metadata: { isActive: dto.isActive },
    });
    return user;
  }

  async getAuditLogs(id: string, pagination: PaginationDto) {
    const { limit = 10, offset = 0 } = pagination;
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { user: { id } },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return { total, data };
  }
}
