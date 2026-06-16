import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserThemeColors1710000000003 implements MigrationInterface {
  name = 'AddUserThemeColors1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR(20) NOT NULL DEFAULT '#6d28d9',
      ADD COLUMN IF NOT EXISTS "secondaryColor" VARCHAR(20) NOT NULL DEFAULT '#ecfeff';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS "secondaryColor",
      DROP COLUMN IF EXISTS "primaryColor";
    `);
  }
}
