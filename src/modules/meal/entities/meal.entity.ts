import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int' })
  calories: number;

  @Column({ type: 'time' })
  time: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: MealType })
  type: MealType;

  @Column({ type: 'float', nullable: true })
  proteins?: number;

  @Column({ type: 'float', nullable: true })
  carbs?: number;

  @Column({ type: 'float', nullable: true })
  fats?: number;
}
