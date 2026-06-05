import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum UserGoal {
  LOSE_FAT = 'lose_fat',
  GAIN_MUSCLE = 'gain_muscle',
  BODY_RECOMPOSITION = 'body_recomposition',
  MAINTAIN_WEIGHT = 'maintain_weight',
  IMPROVE_HABITS = 'improve_habits',
}

@Entity('nutrition_plans')
export class NutritionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column({ type: 'varchar', length: 40 })
  goal: UserGoal;

  @Column({ type: 'int' })
  basalMetabolicRate: number;

  @Column({ type: 'int' })
  maintenanceCalories: number;

  @Column({ type: 'int' })
  dailyCalorieGoal: number;

  @Column({ type: 'float' })
  proteinGoal: number;

  @Column({ type: 'float' })
  carbsGoal: number;

  @Column({ type: 'float' })
  fatsGoal: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
