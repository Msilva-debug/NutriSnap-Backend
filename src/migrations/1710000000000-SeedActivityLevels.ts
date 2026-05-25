import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedActivityLevels1710000000000 implements MigrationInterface {
  name = 'SeedActivityLevels1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS activity_levels_id_seq
      START WITH 1
      INCREMENT BY 1;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS activity_levels (
        id integer PRIMARY KEY DEFAULT nextval('activity_levels_id_seq'),
        value varchar(30) NOT NULL UNIQUE,
        label varchar NOT NULL,
        description varchar NOT NULL
      );
    `);

    await queryRunner.query(`
      ALTER SEQUENCE activity_levels_id_seq
      OWNED BY activity_levels.id;
    `);

    await queryRunner.query(`
      INSERT INTO activity_levels (value, label, description)
      VALUES
        ('sedentary', 'Sedentario', 'Poco o nada de ejercicio'),
        ('light', 'Ligero', 'Ejercicio ligero de 1 a 3 dias por semana'),
        ('moderate', 'Moderado', 'Ejercicio moderado de 3 a 5 dias por semana'),
        ('active', 'Activo', 'Ejercicio frecuente de 6 a 7 dias por semana'),
        ('very_active', 'Muy activo', 'Ejercicio intenso diario')
      ON CONFLICT (value) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM activity_levels
      WHERE value IN (
        'sedentary',
        'light',
        'moderate',
        'active',
        'very_active'
      );
    `);
  }
}
