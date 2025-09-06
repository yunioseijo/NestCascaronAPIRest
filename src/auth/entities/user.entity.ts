import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_username', ['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { unique: true, nullable: true })
  username: string | null;

  @Exclude()
  @Column('text', { select: false })
  password: string;

  @Column('text')
  fullName: string;

  @Column('text', { nullable: true })
  firstName?: string | null;

  @Column('text', { nullable: true })
  lastName?: string | null;

  @Column('bool', { default: true })
  isActive: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  // Profile
  @Column('text', { nullable: true })
  avatarUrl?: string | null;

  @Column('text', { nullable: true })
  phone?: string | null;

  @Column('text', { nullable: true })
  bio?: string | null;

  @Column('varchar', { length: 2, nullable: true })
  countryCode?: string | null;

  @Column('varchar', { length: 10, nullable: true })
  locale?: string | null;

  @Column('text', { nullable: true })
  timezone?: string | null;

  // Email verification
  @Column('bool', { default: false })
  emailVerified: boolean;

  @Column('timestamptz', { nullable: true })
  emailVerifiedAt?: Date | null;

  @Exclude()
  @Column('text', { select: false, nullable: true })
  emailVerificationToken?: string | null;

  // Password reset
  @Exclude()
  @Column('text', { select: false, nullable: true })
  passwordResetToken?: string | null;

  @Column('timestamptz', { nullable: true })
  passwordResetTokenExpiresAt?: Date | null;

  // Two-factor auth
  @Column('bool', { default: false })
  twoFactorEnabled: boolean;

  @Exclude()
  @Column('text', { select: false, nullable: true })
  twoFactorSecret?: string | null;

  // Session audit
  @Column('timestamptz', { nullable: true })
  lastLoginAt?: Date | null;

  @Column('inet', { nullable: true })
  lastLoginIp?: string | null;

  // Extensibility
  @Column('jsonb', { nullable: true, default: () => "'{}'::jsonb" })
  metadata?: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @BeforeInsert()
  normalizeBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
    if (this.username) this.username = this.username.toLowerCase().trim();
    if (this.fullName) this.fullName = this.fullName.trim();
  }

  @BeforeUpdate()
  normalizeBeforeUpdate() {
    this.normalizeBeforeInsert();
  }
}
