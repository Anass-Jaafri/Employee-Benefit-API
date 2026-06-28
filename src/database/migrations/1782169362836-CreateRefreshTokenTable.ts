import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokenTable1782169362836 implements MigrationInterface {
  name = 'CreateRefreshTokenTable1782169362836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_token" (
        "id"          SERIAL NOT NULL,
        "tokenHash"   character varying NOT NULL,
        "userId"      integer NOT NULL,
        "expiresAt"   TIMESTAMP NOT NULL,
        "revoked"     boolean NOT NULL DEFAULT false,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_token" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_token"
        ADD CONSTRAINT "FK_refresh_token_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id")
        ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_token_tokenHash" ON "refresh_token" ("tokenHash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_token_userId" ON "refresh_token" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_refresh_token_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_token_tokenHash"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_refresh_token_user"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token"`);
  }
}
