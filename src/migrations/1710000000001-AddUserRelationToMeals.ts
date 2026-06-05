import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRelationToMeals1710000000001 implements MigrationInterface {
  name = 'AddUserRelationToMeals1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meals
      ADD COLUMN IF NOT EXISTS "userId" INTEGER;
    `);

    await queryRunner.query(`
      UPDATE meals
      SET "userId" = (
        SELECT id
        FROM users
        ORDER BY id
        LIMIT 1
      )
      WHERE "userId" IS NULL
        AND EXISTS (SELECT 1 FROM users);
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM meals
          WHERE "userId" IS NULL
        ) THEN
          RAISE EXCEPTION 'No se puede agregar userId NOT NULL a meals porque existen comidas sin usuario y no hay usuarios para asignar';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE meals
      ALTER COLUMN "userId" SET NOT NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_meals_user'
        ) THEN
          ALTER TABLE meals
          ADD CONSTRAINT "FK_meals_user"
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_meals_user_date"
      ON meals ("userId", date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_meals_user_date";
    `);

    await queryRunner.query(`
      ALTER TABLE meals
      DROP CONSTRAINT IF EXISTS "FK_meals_user";
    `);

    await queryRunner.query(`
      ALTER TABLE meals
      DROP COLUMN IF EXISTS "userId";
    `);
  }
}
