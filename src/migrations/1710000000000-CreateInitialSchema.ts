import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1710000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS activity_levels (
        id SERIAL PRIMARY KEY,
        value VARCHAR(30) NOT NULL UNIQUE,
        label VARCHAR NOT NULL,
        description VARCHAR NOT NULL
      );
    `);

    await queryRunner.query(`
      INSERT INTO activity_levels (value, label, description)
      VALUES
        ('sedentary', 'Sedentario', 'poco o nada de ejercicio'),
        ('light', 'Ligero', '1-3 dias/semana'),
        ('moderate', 'Moderado', '3-5 dias/semana'),
        ('active', 'Activo', '6-7 dias/semana'),
        ('very_active', 'Muy activo', 'ejercicio intenso diario')
      ON CONFLICT (value) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL DEFAULT '',
        birthdate DATE NOT NULL,
        age INTEGER NOT NULL,
        weight DOUBLE PRECISION NOT NULL,
        height DOUBLE PRECISION NOT NULL,
        sex VARCHAR NOT NULL,
        "primaryColor" VARCHAR(20) NOT NULL DEFAULT '#6d28d9',
        "secondaryColor" VARCHAR(20) NOT NULL DEFAULT '#ecfeff',
        "activityLevelId" INTEGER NOT NULL,
        CONSTRAINT "FK_users_activity_level"
          FOREIGN KEY ("activityLevelId")
          REFERENCES activity_levels(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      INSERT INTO users (
        name,
        email,
        password,
        birthdate,
        age,
        weight,
        height,
        sex,
        "primaryColor",
        "secondaryColor",
        "activityLevelId"
      )
      VALUES (
        'Mateo Celis',
        'mateocelis1550@gmail.com',
        '$2b$12$4rflimhwfTsyD7YBxDXMNu8khTpimX5r6SGyPm3vQEyMJmCqcDHg2',
        '2000-01-01',
        24,
        70,
        175,
        'masculino',
        '#6d28d9',
        '#ecfeff',
        (SELECT id FROM activity_levels WHERE value = 'moderate')
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        birthdate = EXCLUDED.birthdate,
        age = EXCLUDED.age,
        weight = EXCLUDED.weight,
        height = EXCLUDED.height,
        sex = EXCLUDED.sex,
        "primaryColor" = EXCLUDED."primaryColor",
        "secondaryColor" = EXCLUDED."secondaryColor",
        "activityLevelId" = EXCLUDED."activityLevelId";
    `);

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
      VALUES (
        (SELECT id FROM users WHERE email = 'mateocelis1550@gmail.com'),
        'maintain_weight',
        1680,
        2604,
        2604,
        112,
        377,
        72
      )
      ON CONFLICT ("userId") DO UPDATE SET
        goal = EXCLUDED.goal,
        "basalMetabolicRate" = EXCLUDED."basalMetabolicRate",
        "maintenanceCalories" = EXCLUDED."maintenanceCalories",
        "dailyCalorieGoal" = EXCLUDED."dailyCalorieGoal",
        "proteinGoal" = EXCLUDED."proteinGoal",
        "carbsGoal" = EXCLUDED."carbsGoal",
        "fatsGoal" = EXCLUDED."fatsGoal",
        "updatedAt" = now();
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'meals_type_enum'
        ) THEN
          CREATE TYPE meals_type_enum AS ENUM (
            'breakfast',
            'lunch',
            'dinner',
            'snack'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        calories INTEGER NOT NULL,
        time TIME NOT NULL,
        date DATE NOT NULL,
        type meals_type_enum NOT NULL,
        "userId" INTEGER NOT NULL,
        proteins DOUBLE PRECISION,
        carbs DOUBLE PRECISION,
        fats DOUBLE PRECISION,
        CONSTRAINT "FK_meals_user"
          FOREIGN KEY ("userId")
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_meals_user_date"
      ON meals ("userId", date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS meals;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS meals_type_enum;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS nutrition_plans;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS users;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS activity_levels;
    `);
  }
}
