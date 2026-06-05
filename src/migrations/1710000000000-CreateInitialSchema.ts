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
      INSERT INTO users (
        name,
        email,
        password,
        birthdate,
        age,
        weight,
        height,
        sex,
        "activityLevelId"
      )
      VALUES (
        'Mateo Celis',
        'mateocelis1550@gmail.com',
        'dd14f72ec28814871eaafafd28444f7e:3b95c0d0cfa1aafe16b4ea220dc93a4b4d7fd7d6aa30b80fc70b9dfa60cd8ce74471ef56febd7c66a2ccb5596ede0b324b42efd7c84fd56bd63ce064f8dc45ba',
        '2000-01-01',
        24,
        70,
        175,
        'masculino',
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
        "activityLevelId" = EXCLUDED."activityLevelId";
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
      DROP TABLE IF EXISTS users;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS activity_levels;
    `);
  }
}
