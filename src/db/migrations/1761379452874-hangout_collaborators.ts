import { MigrationInterface, QueryRunner } from 'typeorm';

export class HangoutCollaborators1761379452874 implements MigrationInterface {
  name = 'HangoutCollaborators1761379452874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17d1817f241f10a3dbafb169fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951b8f1dfc94ac1d0301a14b7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad5211c9b62706b04224e9da30"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6499ee9fe99eb602d3d76e6bf3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1cd614469384951bd9ed5fd6b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "CHK_e5be6fdd16ef0f619f35a8a01a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "CHK_ef4107c512daeecb80456807f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "CHK_b7f6468d234c9678023ac633dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "CHK_a6eb4b269c1d98f09e97fa39c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "CHK_21f7795b43b81e4591390ebca0"`,
    );
    await queryRunner.query(
      `CREATE TABLE "hangout_collaborators" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "hangout_id" integer NOT NULL, "user_id" integer NOT NULL, "role" character varying(50) NOT NULL DEFAULT 'collaborator', "invited_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4734f4d79c1778013dadd5ce63d" UNIQUE ("uuid"), CONSTRAINT "UQ_c2743422e29e64d2c46d82ddf9c" UNIQUE ("hangout_id", "user_id"), CONSTRAINT "PK_5a2d9b749482140c1a0b5486438" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4734f4d79c1778013dadd5ce63" ON "hangout_collaborators" ("uuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f1bdadd4bda6782ccb98361a6" ON "hangout_collaborators" ("hangout_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2f854e27d9058a7dea7ef7b03" ON "hangout_collaborators" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81770312e5595d740e8f3f1bdc" ON "hangout_collaborators" ("hangout_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_951b8f1dfc94ac1d0301a14b7e" ON "users" ("uuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17d1817f241f10a3dbafb169fd" ON "users" ("phone_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e699b683d514043c8354ee5696" ON "hangouts" ("uuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_95bbbe88323d02054ebe3f9eef" ON "hangouts" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_442c47d074f186335e6f8cd621" ON "hangouts" ("description") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b49135fffe222e947d20237ad8" ON "hangouts" ("location_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a768645acdcd24a8b6bf6f4a82" ON "hangouts" ("visibility", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de57baea0cc21fda3f00798f0c" ON "hangouts" ("user_id", "collaboration_mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e86a8bab719b2bb119dab350b3" ON "hangouts" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f58554d86f6c9415511ff0eef" ON "hangouts" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b4dda1877e568fd585b9e6221" ON "suggestions" ("suggestion_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10cc0d89e3552523814208f3ca" ON "suggestions" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" ADD CONSTRAINT "FK_6f1bdadd4bda6782ccb98361a66" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" ADD CONSTRAINT "FK_b2f854e27d9058a7dea7ef7b036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" ADD CONSTRAINT "FK_18b7792bc5a4fbfc50de32d2f41" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" DROP CONSTRAINT "FK_18b7792bc5a4fbfc50de32d2f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" DROP CONSTRAINT "FK_b2f854e27d9058a7dea7ef7b036"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangout_collaborators" DROP CONSTRAINT "FK_6f1bdadd4bda6782ccb98361a66"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10cc0d89e3552523814208f3ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b4dda1877e568fd585b9e6221"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f58554d86f6c9415511ff0eef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e86a8bab719b2bb119dab350b3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de57baea0cc21fda3f00798f0c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a768645acdcd24a8b6bf6f4a82"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b49135fffe222e947d20237ad8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_442c47d074f186335e6f8cd621"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_95bbbe88323d02054ebe3f9eef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e699b683d514043c8354ee5696"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17d1817f241f10a3dbafb169fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951b8f1dfc94ac1d0301a14b7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81770312e5595d740e8f3f1bdc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2f854e27d9058a7dea7ef7b03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f1bdadd4bda6782ccb98361a6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4734f4d79c1778013dadd5ce63"`,
    );
    await queryRunner.query(`DROP TABLE "hangout_collaborators"`);
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "CHK_21f7795b43b81e4591390ebca0" CHECK (((suggestion_type)::text = ANY ((ARRAY['location'::character varying, 'activity'::character varying, 'time'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "CHK_a6eb4b269c1d98f09e97fa39c0" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "CHK_b7f6468d234c9678023ac633dc" CHECK ((((suggestion_type)::text <> 'location'::text) OR (location_name IS NOT NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "CHK_ef4107c512daeecb80456807f1" CHECK ((((suggestion_type)::text <> 'activity'::text) OR (activity_name IS NOT NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "CHK_e5be6fdd16ef0f619f35a8a01a" CHECK ((((suggestion_type)::text <> 'time'::text) OR ((suggested_date IS NOT NULL) AND (suggested_start_time IS NOT NULL))))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cd614469384951bd9ed5fd6b8" ON "suggestions" ("suggestion_type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6499ee9fe99eb602d3d76e6bf3" ON "suggestions" ("status", "hangout_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad5211c9b62706b04224e9da30" ON "suggestions" ("suggestion_type", "hangout_id") WHERE ((status)::text = 'pending'::text)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_951b8f1dfc94ac1d0301a14b7e" ON "users" ("uuid") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_17d1817f241f10a3dbafb169fd" ON "users" ("phone_number") `,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
