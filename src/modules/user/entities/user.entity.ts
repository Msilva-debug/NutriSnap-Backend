import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ActivityLevel,
  ActivityLevelValue,
} from '../../activity-level/entities/activity-level.entity';

@Entity('user')
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

  @Column({ type: 'varchar', length: 30 })
  activityLevel: ActivityLevelValue;

  @ManyToOne(() => ActivityLevel, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'activityLevel', referencedColumnName: 'id' })
  activityLevelOption: ActivityLevel;
}
