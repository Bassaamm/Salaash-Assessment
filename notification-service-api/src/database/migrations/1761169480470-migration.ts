import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761169480470 implements MigrationInterface {
    name = 'Migration1761169480470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."templates_channeltype_enum" AS ENUM('email', 'sms', 'push', 'whatsapp', 'slack')`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "channelType" "public"."templates_channeltype_enum" NOT NULL, "subjectTemplate" text, "bodyTemplate" text NOT NULL, "variables" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "description" text, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d46eebc661b1eac536c73ba2f" ON "templates" ("name", "channelType") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" character varying(255) NOT NULL, "orderNumber" character varying(100) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "total" numeric(10,2) NOT NULL, "metadata" jsonb, "notes" text, CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_151b79a83ba240b0cb31b2302d" ON "orders" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."channels_type_enum" AS ENUM('email', 'sms', 'push', 'whatsapp', 'slack')`);
        await queryRunner.query(`CREATE TABLE "channels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "type" "public"."channels_type_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "configuration" jsonb NOT NULL, "description" text, CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_770bc30bc837ed6fe788bbe118" ON "channels" ("type") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "recipientId" character varying(255) NOT NULL, "channelId" uuid NOT NULL, "templateName" character varying(255) NOT NULL, "data" jsonb NOT NULL, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "idempotencyKey" character varying(255) NOT NULL, "retryCount" integer NOT NULL DEFAULT '0', "sentAt" TIMESTAMP WITH TIME ZONE, "failedAt" TIMESTAMP WITH TIME ZONE, "errorMessage" text, CONSTRAINT "UQ_bd4c79b47c6a55cce999f3706cb" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_831a5a06f879fb0bebf8965871" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bd4c79b47c6a55cce999f3706c" ON "notifications" ("idempotencyKey") `);
        await queryRunner.query(`CREATE INDEX "IDX_92f5d3a7779be163cbea7916c6" ON "notifications" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_db873ba9a123711a4bff527ccd" ON "notifications" ("recipientId") `);
        await queryRunner.query(`CREATE TYPE "public"."delivery_logs_status_enum" AS ENUM('attempting', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "delivery_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "notificationId" uuid NOT NULL, "attemptNumber" integer NOT NULL, "status" "public"."delivery_logs_status_enum" NOT NULL, "responseData" jsonb, "errorMessage" text, "attemptedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c647802ec5e927513f2d0beec47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_62ce6e3d3bae20e6f2c0998432" ON "delivery_logs" ("notificationId") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_7ef922a7bb8a18efefe48fc6dc1" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_logs" ADD CONSTRAINT "FK_62ce6e3d3bae20e6f2c0998432c" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_logs" DROP CONSTRAINT "FK_62ce6e3d3bae20e6f2c0998432c"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_7ef922a7bb8a18efefe48fc6dc1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62ce6e3d3bae20e6f2c0998432"`);
        await queryRunner.query(`DROP TABLE "delivery_logs"`);
        await queryRunner.query(`DROP TYPE "public"."delivery_logs_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db873ba9a123711a4bff527ccd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92f5d3a7779be163cbea7916c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd4c79b47c6a55cce999f3706c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_831a5a06f879fb0bebf8965871"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_770bc30bc837ed6fe788bbe118"`);
        await queryRunner.query(`DROP TABLE "channels"`);
        await queryRunner.query(`DROP TYPE "public"."channels_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_151b79a83ba240b0cb31b2302d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d46eebc661b1eac536c73ba2f"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TYPE "public"."templates_channeltype_enum"`);
    }

}
