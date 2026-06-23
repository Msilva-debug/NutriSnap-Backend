import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFoodNotesAndMonthlySummaries1710000000004 implements MigrationInterface {
  name = 'CreateFoodNotesAndMonthlySummaries1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS daily_food_notes (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        date DATE NOT NULL,
        note TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_daily_food_notes_user"
          FOREIGN KEY ("userId")
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_daily_food_notes_user_date"
      ON daily_food_notes ("userId", date);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS monthly_food_summaries (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        summary TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        model VARCHAR(80),
        "promptVersion" VARCHAR(40),
        "generatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_monthly_food_summaries_user"
          FOREIGN KEY ("userId")
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_monthly_food_summaries_user_period"
      ON monthly_food_summaries ("userId", year, month);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS monthly_food_summaries;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS daily_food_notes;
    `);
  }
}
