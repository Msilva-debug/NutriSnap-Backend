import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { AnalyzeFoodPreparationDto } from './dto/analyze-food-preparation.dto';

export interface FoodPreparationAnalysisResult {
  name: string;
  description: string;
  servings: number;
  caloriesPerServing: number;
  proteinsPerServing: number;
  carbsPerServing: number;
  fatsPerServing: number;
  micronutrients: string;
  notes: string;
}

@Injectable()
export class FoodPreparationAiService {
  constructor(private readonly geminiService: GeminiService) {}

  async analyze(
    analyzeFoodPreparationDto: AnalyzeFoodPreparationDto,
  ): Promise<FoodPreparationAnalysisResult> {
    const description = this.validateDescription(
      analyzeFoodPreparationDto.description,
    );
    const servings = this.validateOptionalServings(
      analyzeFoodPreparationDto.servings,
    );

    const text = await this.geminiService.generateContent(
      this.buildGeminiRequest(description, servings),
      {
        errorMessage: 'Error al llamar al analizador de preparaciones',
        unexpectedTextMessage:
          'Respuesta inesperada del analizador de preparaciones',
      },
    );

    return this.parseAnalysisResult(text);
  }

  private buildGeminiRequest(
    description: string,
    servings?: number,
  ): Record<string, unknown> {
    return {
      contents: [
        {
          parts: [
            {
              text: `Analiza esta preparacion de comida para NutriSnap y estima su informacion nutricional.

Devuelve solo JSON valido con este formato exacto:
{
  "name": "nombre corto de la preparacion",
  "description": "descripcion limpia y resumida de la preparacion",
  "servings": numero de porciones de toda la preparacion,
  "caloriesPerServing": calorias por porcion,
  "proteinsPerServing": gramos de proteina por porcion,
  "carbsPerServing": gramos de carbohidratos por porcion,
  "fatsPerServing": gramos de grasas por porcion,
  "micronutrients": "micronutrientes o detalles relevantes",
  "notes": "aclaraciones breves sobre la estimacion"
}

Reglas:
- La preparacion puede venir de texto escrito o dictado por voz.
- Estima los macros de forma realista a partir de ingredientes, cantidades y metodo de preparacion.
- Si el usuario indica cuantas porciones salen, usa esa cantidad para dividir los macros.
- Si no hay porciones claras, infiere una cantidad razonable y explicalo en "notes".
- Si se envio una cantidad de porciones externa, usala como prioridad.
- Si faltan cantidades exactas, estima con porciones caseras comunes y mencionalo en "notes".
- No des diagnosticos medicos ni beneficios de salud inventados.
- Usa nombres de alimentos e ingredientes del texto del usuario.
- Los campos numericos deben ser numeros, no texto.
- Devuelve solo JSON, sin markdown ni explicaciones adicionales.

Porciones enviadas por el frontend: ${servings ?? 'no especificadas'}

Texto del usuario:
${description}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
  }

  private parseAnalysisResult(text: string): FoodPreparationAnalysisResult {
    try {
      const parsed = JSON.parse(this.cleanJsonText(text)) as Partial<
        Record<keyof FoodPreparationAnalysisResult, unknown>
      >;

      return {
        name: this.getRequiredString(parsed.name, 'name'),
        description: this.getRequiredString(parsed.description, 'description'),
        servings: this.getRequiredInteger(parsed.servings, 'servings', 1),
        caloriesPerServing: this.getRequiredInteger(
          parsed.caloriesPerServing,
          'caloriesPerServing',
          0,
        ),
        proteinsPerServing: this.getRequiredNumber(
          parsed.proteinsPerServing,
          'proteinsPerServing',
        ),
        carbsPerServing: this.getRequiredNumber(
          parsed.carbsPerServing,
          'carbsPerServing',
        ),
        fatsPerServing: this.getRequiredNumber(
          parsed.fatsPerServing,
          'fatsPerServing',
        ),
        micronutrients: this.getOptionalString(parsed.micronutrients),
        notes: this.getOptionalString(parsed.notes),
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(
        'No se pudo interpretar el analisis de preparacion',
      );
    }
  }

  private validateDescription(description: string): string {
    if (typeof description !== 'string' || !description.trim()) {
      throw new BadRequestException('La descripcion de la preparacion es requerida');
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > 8000) {
      throw new BadRequestException(
        'La descripcion no puede superar 8000 caracteres',
      );
    }

    return trimmedDescription;
  }

  private validateOptionalServings(servings: unknown): number | undefined {
    if (servings === undefined || servings === null || servings === '') {
      return undefined;
    }

    const numberValue = Number(servings);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(
        'Las porciones deben ser un numero entero mayor a 0',
      );
    }

    return numberValue;
  }

  private cleanJsonText(text: string): string {
    return text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private getRequiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadGatewayException(
        `El analisis IA no incluyo un valor valido para ${field}`,
      );
    }

    return value.trim();
  }

  private getOptionalString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private getRequiredInteger(
    value: unknown,
    field: string,
    minValue: number,
  ): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < minValue) {
      throw new BadGatewayException(
        `El analisis IA no incluyo un numero valido para ${field}`,
      );
    }

    return Math.round(numberValue);
  }

  private getRequiredNumber(value: unknown, field: string): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      throw new BadGatewayException(
        `El analisis IA no incluyo un numero valido para ${field}`,
      );
    }

    return Math.round(numberValue * 10) / 10;
  }
}
