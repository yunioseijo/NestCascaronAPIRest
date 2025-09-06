import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  user?: User | null;

  @Column('text')
  action: string;

  @Column('jsonb', { nullable: true, default: () => "'{}'::jsonb" })
  metadata?: Record<string, any> | null;

  @Column('inet', { nullable: true })
  ip?: string | null;

  @Column('text', { nullable: true })
  userAgent?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

