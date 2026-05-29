import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityLevel } from '../../activity-level/entities/activity-level.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, default: '' })
  password: string;

  @Column({ type: 'date' })
  birthdate: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float' })
  height: number;

  @Column()
  sex: string;

  @Column({ type: 'int' })
  activityLevelId: number;

  @ManyToOne(() => ActivityLevel, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'activityLevelId', referencedColumnName: 'id' })
  activityLevelOption: ActivityLevel;
}
