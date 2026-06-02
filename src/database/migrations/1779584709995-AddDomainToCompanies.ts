import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDomainToCompanies1779584709995 implements MigrationInterface {
    name = 'AddDomainToCompanies1779584709995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" ADD "domain" character varying UNIQUE`);
        await queryRunner.query(`ALTER TABLE "company" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "domain"`);
    }

}
