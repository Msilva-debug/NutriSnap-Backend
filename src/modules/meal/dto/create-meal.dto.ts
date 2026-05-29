import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '../entities/meal.entity';

export class CreateMealDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador generado automaticamente',
    readOnly: true,
  })
  id?: number;

  @ApiPropertyOptional({
    example: '2026-05-29',
    description: 'Fecha generada automaticamente',
    readOnly: true,
  })
  date?: string;

  @ApiProperty({
    example: 'Avena con banano',
    description: 'Nombre de la comida',
  })
  name: string;

  @ApiProperty({
    example: 350,
    description: 'Calorias de la comida',
  })
  calories: number;

  @ApiProperty({
    enum: MealType,
    example: MealType.BREAKFAST,
    description: 'Tipo de comida',
  })
  type: MealType;

  @ApiPropertyOptional({
    example: 20,
    description: 'Proteinas en gramos',
  })
  proteins?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Carbohidratos en gramos',
  })
  carbs?: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Grasas en gramos',
  })
  fats?: number;
}
