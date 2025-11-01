import { MigrationInterface, QueryRunner } from 'typeorm';

export class HangoutInvitation1761955057408 implements MigrationInterface {
  name = 'HangoutInvitation1761955057408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_066c9c4db53ca653036d872461" ON "hangouts" ("visibility", "start_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8cb5d07de44787c85b41bcdb07" ON "hangouts" ("user_id", "start_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8fa3ec2fe23b3604fa812f3fdc" ON "invitations" ("uuid") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8fa3ec2fe23b3604fa812f3fdc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8cb5d07de44787c85b41bcdb07"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_066c9c4db53ca653036d872461"`,
    );
  }
}
