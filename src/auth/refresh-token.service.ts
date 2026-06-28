import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  /** SHA-256 hash of the raw JWT string */
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Persist a newly issued refresh token */
  async save(userId: number, rawToken: string, expiresAt: Date): Promise<void> {
    const record = this.repo.create({
      userId,
      tokenHash: this.hash(rawToken),
      expiresAt,
      revoked: false,
    });
    await this.repo.save(record);
  }

  /**
   * Validate an incoming refresh token:
   *   1. Find the row by hash
   *   2. Reject if not found, already revoked, or expired
   */
  async validate(rawToken: string): Promise<RefreshToken> {
    const record = await this.repo.findOne({
      where: { tokenHash: this.hash(rawToken) },
    });

    if (!record) {
      throw new UnauthorizedException('Refresh token not recognised');
    }
    if (record.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    return record;
  }

  /** Revoke a single token by its raw value (logout / rotation) */
  async revoke(rawToken: string): Promise<void> {
    await this.repo.update(
      { tokenHash: this.hash(rawToken) },
      { revoked: true },
    );
  }

  /** Revoke ALL tokens for a user (e.g. password change, security lockout) */
  async revokeAllForUser(userId: number): Promise<void> {
    await this.repo.update({ userId, revoked: false }, { revoked: true });
  }

  /** Prune expired rows — call from a scheduled job to keep the table lean */
  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
