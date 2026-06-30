import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFoodPreparations1710000000004
  implements MigrationInterface
{
  name = 'CreateFoodPreparations1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS food_preparations (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        servings INTEGER NOT NULL DEFAULT 1,
        "caloriesPerServing" INTEGER NOT NULL,
        "proteinsPerServing" DOUBLE PRECISION NOT NULL,
        "carbsPerServing" DOUBLE PRECISION NOT NULL,
        "fatsPerServing" DOUBLE PRECISION NOT NULL,
        micronutrients TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_food_preparations_user"
          FOREIGN KEY ("userId")
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_food_preparations_user"
      ON food_preparations ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_food_preparations_user_status"
      ON food_preparations ("userId", status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS food_preparations;
    `);
  }
}
