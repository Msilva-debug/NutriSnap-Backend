import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '../../meal/entities/meal.entity';

export class CreateMealFromPreparationDto {
  @ApiProperty({
    enum: MealType,
    example: MealType.SNACK,
    description: 'Tipo de comida que se registrara usando la preparacion',
  })
  type: MealType;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Cantidad de porciones consumidas. Si no se envia, se registra 1 porcion.',
  })
  servings?: number;
}
