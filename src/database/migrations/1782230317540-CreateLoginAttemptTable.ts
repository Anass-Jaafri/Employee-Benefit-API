import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginAttemptTable1782230317540 implements MigrationInterface {
  name = 'CreateLoginAttemptTable1782230317540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "login_attempt" (
        "id"          SERIAL NOT NULL,
        "email"       character varying NOT NULL,
        "failedCount" integer NOT NULL DEFAULT 0,
        "lockedUntil" TIMESTAMP,
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_attempt" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_login_attempt_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_login_attempt_email" ON "login_attempt" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_login_attempt_email"`);
    await queryRunner.query(`DROP TABLE "login_attempt"`);
  }
}
