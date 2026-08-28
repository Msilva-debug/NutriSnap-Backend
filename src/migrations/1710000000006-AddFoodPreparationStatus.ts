import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFoodPreparationStatus1710000000006 implements MigrationInterface {
  name = 'AddFoodPreparationStatus1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE food_preparations
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_food_preparations_user_status"
      ON food_preparations ("userId", status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_food_preparations_user_status";
    `);

    await queryRunner.query(`
      ALTER TABLE food_preparations
      DROP COLUMN IF EXISTS status;
    `);
  }
}
