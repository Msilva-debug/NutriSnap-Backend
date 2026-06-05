import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNutritionPlans1710000000002 implements MigrationInterface {
  name = 'CreateNutritionPlans1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nutrition_plans (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL UNIQUE,
        goal VARCHAR(40) NOT NULL DEFAULT 'maintain_weight',
        "basalMetabolicRate" INTEGER NOT NULL,
        "maintenanceCalories" INTEGER NOT NULL,
        "dailyCalorieGoal" INTEGER NOT NULL,
        "proteinGoal" DOUBLE PRECISION NOT NULL,
        "carbsGoal" DOUBLE PRECISION NOT NULL,
        "fatsGoal" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_nutrition_plans_user"
          FOREIGN KEY ("userId")
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      INSERT INTO nutrition_plans (
        "userId",
        goal,
        "basalMetabolicRate",
        "maintenanceCalories",
        "dailyCalorieGoal",
        "proteinGoal",
        "carbsGoal",
        "fatsGoal"
      )
      WITH base_calculations AS (
        SELECT
          users.id AS "userId",
          'maintain_weight' AS goal,
          users.weight,
          ROUND(
            9.99 * users.weight +
            6.25 * users.height -
            4.92 * users.age +
            CASE
              WHEN LOWER(users.sex) IN ('femenino', 'female', 'mujer', 'f')
                THEN -161
              ELSE 5
            END
          )::INTEGER AS "basalMetabolicRate",
          CASE activity_levels.value
            WHEN 'sedentary' THEN 1.2
            WHEN 'light' THEN 1.375
            WHEN 'moderate' THEN 1.55
            WHEN 'active' THEN 1.725
            WHEN 'very_active' THEN 1.9
            ELSE 1.2
          END AS "activityFactor"
        FROM users
        INNER JOIN activity_levels
          ON activity_levels.id = users."activityLevelId"
      ),
      target_calculations AS (
        SELECT
          "userId",
          goal,
          weight,
          "basalMetabolicRate",
          ROUND("basalMetabolicRate" * "activityFactor")::INTEGER
            AS "maintenanceCalories"
        FROM base_calculations
      ),
      macro_calculations AS (
        SELECT
          "userId",
          goal,
          "basalMetabolicRate",
          "maintenanceCalories",
          "maintenanceCalories" AS "dailyCalorieGoal",
          ROUND(weight * 1.6)::DOUBLE PRECISION AS "proteinGoal",
          ROUND(("maintenanceCalories" * 0.25) / 9)::DOUBLE PRECISION
            AS "fatsGoal"
        FROM target_calculations
      )
      SELECT
        "userId",
        goal,
        "basalMetabolicRate",
        "maintenanceCalories",
        "dailyCalorieGoal",
        "proteinGoal",
        GREATEST(
          0,
          ROUND(
            (
              "dailyCalorieGoal" -
              "proteinGoal" * 4 -
              "fatsGoal" * 9
            ) / 4
          )::DOUBLE PRECISION
        ) AS "carbsGoal",
        "fatsGoal"
      FROM macro_calculations
      ON CONFLICT ("userId") DO NOTHING;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS "fatsGoal",
      DROP COLUMN IF EXISTS "carbsGoal",
      DROP COLUMN IF EXISTS "proteinGoal",
      DROP COLUMN IF EXISTS "dailyCalorieGoal",
      DROP COLUMN IF EXISTS "maintenanceCalories",
      DROP COLUMN IF EXISTS "basalMetabolicRate",
      DROP COLUMN IF EXISTS goal;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS nutrition_plans;
    `);
  }
}
