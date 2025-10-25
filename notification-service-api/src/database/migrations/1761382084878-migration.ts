import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761382084878 implements MigrationInterface {
    name = 'Migration1761382084878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0d46eebc661b1eac536c73ba2f"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "channelType"`);
        await queryRunner.query(`DROP TYPE "public"."templates_channeltype_enum"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "subjectTemplate"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "bodyTemplate"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "channel" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "subject" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "body" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "version" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "variables"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "variables" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "variables"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "variables" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "body"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "subject"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "bodyTemplate" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "subjectTemplate" text`);
        await queryRunner.query(`CREATE TYPE "public"."templates_channeltype_enum" AS ENUM('email', 'sms', 'push', 'whatsapp', 'slack')`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "channelType" "public"."templates_channeltype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d46eebc661b1eac536c73ba2f" ON "templates" ("name", "channelType") `);
    }

}
