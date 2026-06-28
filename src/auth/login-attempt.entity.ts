import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('login_attempt')
export class LoginAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Index() // looked up by email on every login attempt
  @Column({ unique: true })
  email: string;

  @Column({ default: 0 })
  failedCount: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
