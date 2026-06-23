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

@Entity('monthly_food_summaries')
@Index('IDX_monthly_food_summaries_user_period', ['userId', 'year', 'month'], {
  unique: true,
})
export class MonthlyFoodSummary {
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

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  model?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  promptVersion?: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  generatedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
