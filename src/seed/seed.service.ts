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

    // Create test users
    const testPassword = process.env.SEED_TEST_PASSWORD ?? 'Test123!';
    const testUsers = [
      {
        email: 'user@ahucha.local',
        fullName: 'Normal User',
        roles: ['user'],
        isActive: true,
        emailVerified: true,
      },
      {
        email: 'admin2@ahucha.local',
        fullName: 'Admin Tester',
        roles: ['admin', 'user'],
        isActive: true,
        emailVerified: true,
      },
      {
        email: 'super@ahucha.local',
        fullName: 'Super User',
        roles: ['super-user', 'user'],
        isActive: true,
        emailVerified: true,
      },
      {
        email: 'inactive@ahucha.local',
        fullName: 'Inactive User',
        roles: ['user'],
        isActive: false,
        emailVerified: true,
      },
      {
        email: 'unverified@ahucha.local',
        fullName: 'Unverified User',
        roles: ['user'],
        isActive: true,
        emailVerified: false,
      },
    ];

    const created: Array<{ id: string; email: string; roles: string[] }> = [];
    for (const u of testUsers) {
      const exists = await this.userRepository.findOne({ where: { email: u.email } });
      if (exists) continue;
      const entity = this.userRepository.create({
        ...u,
        password: bcrypt.hashSync(testPassword, 10),
      });
      const saved = await this.userRepository.save(entity);
      created.push({ id: saved.id, email: saved.email, roles: saved.roles });
    }

    // Bulk demo users for pagination/filter testing
    const bulkCount = Number(process.env.SEED_BULK_USERS ?? 20);
    const bulkCreated: Array<{ id: string; email: string; roles: string[] }> = [];
    for (let i = 1; i <= bulkCount; i++) {
      const email = `user${String(i).padStart(2, '0')}@ahucha.local`;
      const exists = await this.userRepository.findOne({ where: { email } });
      if (exists) continue;

      const roles = [
        ...(i % 7 === 0 ? ['super-user', 'user'] : i % 5 === 0 ? ['admin', 'user'] : ['user']),
      ];
      const isActive = i % 6 !== 0; // every 6th inactive
      const emailVerified = i % 4 !== 0; // every 4th unverified

      const entity = this.userRepository.create({
        email,
        username: `user${String(i).padStart(2, '0')}`,
        fullName: `Test User ${i}`,
        password: bcrypt.hashSync(testPassword, 10),
        roles,
        isActive,
        emailVerified,
      });
      const saved = await this.userRepository.save(entity);
      bulkCreated.push({ id: saved.id, email: saved.email, roles: saved.roles });
    }

    return {
      ok: true,
      admin: { id: admin.id, email: admin.email, roles: admin.roles },
      createdTestUsers: created,
      createdBulkUsers: bulkCreated,
      testPassword,
    };
  }
}
