import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveInvitationRoleColumn1761955784383
  implements MigrationInterface
{
  name = 'RemoveInvitationRoleColumn1761955784383';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20e858a379731ab7f95c14a977"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('invitee', 'collaborator', 'organizer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "role" "public"."invitations_role_enum" NOT NULL DEFAULT 'invitee'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20e858a379731ab7f95c14a977" ON "invitations" ("role") `,
    );
  }
}
