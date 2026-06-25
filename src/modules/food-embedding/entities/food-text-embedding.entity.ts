import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FoodTextEmbeddingSourceType {
  DAILY_NOTE = 'daily_note',
}

@Entity('food_text_embeddings')
@Index(
  'IDX_food_text_embeddings_user_source',
  ['userId', 'sourceType', 'sourceId'],
  { unique: true },
)
@Index('IDX_food_text_embeddings_user_type', ['userId', 'sourceType'])
export class FoodTextEmbedding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 40 })
  sourceType: FoodTextEmbeddingSourceType;

  @Column({ type: 'int' })
  sourceId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb' })
  embedding: number[];

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int' })
  dimensions: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
