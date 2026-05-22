import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum ActivityLevelValue {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

@Entity('activity_levels')
export class ActivityLevel {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  id: string;
  @Column()
  value: ActivityLevelValue;

  @Column()
  label: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  sortOrder: number;
}
