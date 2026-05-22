import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '../entities/meal.entity';

export class CreateMealDto {
  @ApiProperty({
    example: 'Oatmeal with banana',
    description: 'Name of the meal',
  })
  name: string;

  @ApiProperty({
    example: 350,
    description: 'Calories in the meal',
  })
  calories: number;

  @ApiProperty({
    example: '08:30',
    description: 'Meal time',
  })
  time: string;

  @ApiProperty({
    enum: MealType,
    example: MealType.BREAKFAST,
    description: 'Meal type',
  })
  type: MealType;

  @ApiPropertyOptional({
    example: 20,
    description: 'Protein content in grams',
  })
  proteins?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Carbohydrate content in grams',
  })
  carbs?: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Fat content in grams',
  })
  fats?: number;
}
