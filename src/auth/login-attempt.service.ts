import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly repo: Repository<LoginAttempt>,
  ) {}

  async checkLockout(email: string): Promise<void> {
    const record = await this.repo.findOne({ where: { email } });
    if (!record) return; // no failed attempts yet

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      const secondsLeft = Math.ceil(
        (record.lockedUntil.getTime() - Date.now()) / 1000,
      );
      throw new HttpException(
        `Account temporarily locked. Try again in ${secondsLeft} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Call AFTER a failed password check.
   * Increments the counter; locks the account once MAX_ATTEMPTS is reached.
   */
  async recordFailure(email: string): Promise<void> {
    let record = await this.repo.findOne({ where: { email } });

    if (!record) {
      record = this.repo.create({ email, failedCount: 0, lockedUntil: null });
    }

    record.failedCount += 1;

    if (record.failedCount >= MAX_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    }

    await this.repo.save(record);
  }

  async clearFailures(email: string): Promise<void> {
    await this.repo.delete({ email });
  }
}
