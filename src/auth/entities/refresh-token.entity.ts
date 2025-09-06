import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user', ['user'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('text', { select: false })
  hashedToken: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column('timestamptz')
  expiresAt: Date;

  @Column('timestamptz', { nullable: true })
  revokedAt?: Date | null;

  @Column('uuid', { nullable: true })
  replacedByTokenId?: string | null;

  @Column('text', { nullable: true })
  userAgent?: string | null;

  @Column('inet', { nullable: true })
  ip?: string | null;
}

