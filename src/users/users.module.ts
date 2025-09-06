import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../auth/entities/user.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
