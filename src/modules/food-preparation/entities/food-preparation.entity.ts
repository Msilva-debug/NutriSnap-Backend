import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum FoodPreparationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('food_preparations')
@Index('IDX_food_preparations_user', ['userId'])
export class FoodPreparation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: FoodPreparationStatus.ACTIVE,
  })
  status: FoodPreparationStatus;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'int' })
  caloriesPerServing: number;

  @Column({ type: 'float' })
  proteinsPerServing: number;

  @Column({ type: 'float' })
  carbsPerServing: number;

  @Column({ type: 'float' })
  fatsPerServing: number;

  @Column({ type: 'text', nullable: true })
  micronutrients?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
