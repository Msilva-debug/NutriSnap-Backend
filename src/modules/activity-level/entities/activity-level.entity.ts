import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ActivityLevelValue {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

@Entity('activity_levels')
export class ActivityLevel {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  value: ActivityLevelValue;

  @Column()
  label: string;

  @Column()
  description: string;
}
