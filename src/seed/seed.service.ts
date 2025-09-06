import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../auth/entities/user.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(secretHeader?: string) {
    const seedSecret = process.env.SEED_SECRET ?? 'dev-seed';
    if (seedSecret && secretHeader !== seedSecret) {
      throw new UnauthorizedException('Invalid seed secret');
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ahucha.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const fullName = process.env.ADMIN_NAME ?? 'Super Admin';

    let admin = await this.userRepository.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = this.userRepository.create({
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, 10),
        fullName,
        roles: ['admin', 'super-user', 'user'],
        isActive: true,
        emailVerified: true,
      });
      await this.userRepository.save(admin);
    }

    return {
      ok: true,
      admin: { id: admin.id, email: admin.email, roles: admin.roles },
    };
  }
}

