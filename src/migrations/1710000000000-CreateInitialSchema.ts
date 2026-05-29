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
        "activityLevelId" INTEGER NOT NULL,
        CONSTRAINT "FK_users_activity_level"
          FOREIGN KEY ("activityLevelId")
          REFERENCES activity_levels(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
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
        proteins DOUBLE PRECISION,
        carbs DOUBLE PRECISION,
        fats DOUBLE PRECISION
      );
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
      DROP TABLE IF EXISTS users;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS activity_levels;
    `);
  }
}
