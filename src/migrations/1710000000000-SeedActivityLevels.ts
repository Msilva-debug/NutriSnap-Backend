import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUser1710000000001 implements MigrationInterface {
  name = 'SeedUser1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (
        id,
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
        1,
        'Mateo',
        'mateocelis1550@gmail.com',
        '',
        '2004-06-01',
        24,
        70,
        170,
        'male',
        1
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
      SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        COALESCE((SELECT MAX(id) FROM users), 1),
        true
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM users
      WHERE email = 'mateocelis1550@gmail.com';
    `);
  }
}
