import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FoodPreparation } from '../../food-preparation/entities/food-preparation.entity';
import { User } from '../../user/entities/user.entity';

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

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  foodPreparationId?: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => FoodPreparation, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'foodPreparationId', referencedColumnName: 'id' })
  foodPreparation?: FoodPreparation;

  @Column({ type: 'float', nullable: true })
  proteins?: number;

  @Column({ type: 'float', nullable: true })
  carbs?: number;

  @Column({ type: 'float', nullable: true })
  fats?: number;
}
