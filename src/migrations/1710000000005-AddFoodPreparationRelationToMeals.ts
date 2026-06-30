import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFoodPreparationRelationToMeals1710000000005
  implements MigrationInterface
{
  name = 'AddFoodPreparationRelationToMeals1710000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meals
      ADD COLUMN IF NOT EXISTS "foodPreparationId" INTEGER;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_meals_food_preparation"
      ON meals ("foodPreparationId");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_meals_food_preparation'
        ) THEN
          ALTER TABLE meals
          ADD CONSTRAINT "FK_meals_food_preparation"
            FOREIGN KEY ("foodPreparationId")
            REFERENCES food_preparations(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meals
      DROP CONSTRAINT IF EXISTS "FK_meals_food_preparation";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_meals_food_preparation";
    `);

    await queryRunner.query(`
      ALTER TABLE meals
      DROP COLUMN IF EXISTS "foodPreparationId";
    `);
  }
}
