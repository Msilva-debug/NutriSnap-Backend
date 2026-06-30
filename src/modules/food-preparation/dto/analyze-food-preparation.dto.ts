import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeFoodPreparationDto {
  @ApiProperty({
    example:
      'Prepare galletas con 100 ml de leche, 1 cucharada de azucar, 1 taza de avena y 1 huevo. Salieron 6 galletas.',
    description: 'Texto libre escrito o dictado por el usuario',
  })
  description: string;

  @ApiPropertyOptional({
    example: 6,
    description:
      'Cantidad de porciones que salen de la preparacion. Si no se envia, la IA intentara inferirla.',
  })
  servings?: number;
}
