import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodPreparationDto {
  @ApiProperty({
    example: 'Galletas de avena caseras',
    description: 'Nombre corto para reutilizar la preparacion',
  })
  name: string;

  @ApiProperty({
    example:
      'Galletas preparadas con avena, leche, huevo y una cucharada de azucar.',
    description: 'Descripcion original o ajustada por el usuario',
  })
  description: string;

  @ApiProperty({
    example: 6,
    description: 'Cantidad de porciones que salen de la preparacion completa',
  })
  servings: number;

  @ApiProperty({
    example: 145,
    description: 'Calorias estimadas por porcion',
  })
  caloriesPerServing: number;

  @ApiProperty({
    example: 5,
    description: 'Proteinas estimadas por porcion en gramos',
  })
  proteinsPerServing: number;

  @ApiProperty({
    example: 22,
    description: 'Carbohidratos estimados por porcion en gramos',
  })
  carbsPerServing: number;

  @ApiProperty({
    example: 4,
    description: 'Grasas estimadas por porcion en gramos',
  })
  fatsPerServing: number;

  @ApiPropertyOptional({
    example: 'Aporta fibra por la avena y calcio por la leche.',
    description: 'Micronutrientes o detalles nutricionales relevantes',
  })
  micronutrients?: string;

  @ApiPropertyOptional({
    example:
      'Valores aproximados. La receta puede cambiar si se modifica la cantidad de azucar o leche.',
    description: 'Notas de estimacion o preparacion',
  })
  notes?: string;
}
