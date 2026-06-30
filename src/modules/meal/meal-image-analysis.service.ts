import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

export interface UploadedMealImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  proteins_g: number;
  carbs_g: number;
  fats_g: number;
  micronutrients: string;
}

@Injectable()
export class MealImageAnalysisService {
  constructor(private readonly geminiService: GeminiService) {}

  async analyze(image: UploadedMealImage): Promise<FoodAnalysisResult> {
    this.validateImage(image);

    const text = await this.geminiService.generateContent(
      this.buildGeminiRequest(image),
      {
        errorMessage: 'Error al llamar al analizador IA',
        unexpectedTextMessage: 'Respuesta inesperada del analizador IA',
      },
    );

    return this.parseAnalysisResult(text);
  }

  private validateImage(image: UploadedMealImage): void {
    if (!image?.buffer?.length) {
      throw new BadRequestException('La imagen es requerida');
    }

    if (!/^image\/(jpeg|png|webp)$/.test(image.mimetype)) {
      throw new BadRequestException(
        'La imagen debe estar en formato JPG, PNG o WEBP',
      );
    }
  }

  private buildGeminiRequest(image: UploadedMealImage): Record<string, unknown> {
    return {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: image.mimetype,
                data: image.buffer.toString('base64'),
              },
            },
            {
              text: `Analiza esta imagen para NutriSnap y proporciona la informacion nutricional en JSON con el siguiente formato exacto:
            {
              "name": "nombre del plato",
              "calories": numero de calorias,
              "proteins_g": gramos de proteina,
              "carbs_g": gramos de carbohidratos,
              "fats_g": gramos de grasas,
              "micronutrients": "lista de micronutrientes principales"
            }

            Reglas importantes:
            - Si la imagen muestra una comida o plato preparado, estima los nutrientes de forma realista segun los alimentos visibles y una porcion probable.
            - Si la imagen muestra la parte trasera de un producto, una tabla nutricional, etiqueta nutricional, nutrition facts o informacion de macronutrientes, prioriza los valores de esa etiqueta sobre cualquier estimacion visual.
            - Si hay etiqueta nutricional legible, extrae calorias, proteina, carbohidratos y grasas directamente de la etiqueta.
            - Si la etiqueta trae valores por porcion, usa los valores por porcion.
            - Si la etiqueta trae valores por envase o paquete completo y no hay valores por porcion, usa los valores por envase.
            - Si la etiqueta solo trae valores por 100 g o 100 ml, usa esos valores e indicalo en "micronutrients".
            - Si aparecen tanto valores por porcion como por 100 g, usa por porcion.
            - Si la etiqueta trae tamano de porcion y porciones por envase, no multipliques por todo el envase a menos que la etiqueta indique explicitamente valores por envase.
            - Si algun macronutriente no se ve claramente, estima solo ese campo con cuidado usando el resto de la etiqueta o el tipo de producto.
            - Si el nombre del producto es visible, usalo en "name"; si no, usa "Producto con etiqueta nutricional".
            - En "micronutrients", incluye micronutrientes relevantes visibles en la etiqueta, por ejemplo sodio, fibra, azucares, calcio, hierro, potasio o vitaminas. Tambien menciona si los valores usados son por porcion, por envase o por 100 g/ml.
            - No inventes beneficios de salud ni explicaciones medicas.
            - Devuelve solo el JSON, sin markdown ni explicaciones adicionales.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
  }

  private parseAnalysisResult(text: string): FoodAnalysisResult {
    try {
      const parsed = JSON.parse(this.cleanJsonText(text)) as Partial<
        Record<keyof FoodAnalysisResult, unknown>
      >;

      return {
        name: this.getRequiredString(parsed.name, 'name'),
        calories: this.getRequiredNumber(parsed.calories, 'calories'),
        proteins_g: this.getRequiredNumber(parsed.proteins_g, 'proteins_g'),
        carbs_g: this.getRequiredNumber(parsed.carbs_g, 'carbs_g'),
        fats_g: this.getRequiredNumber(parsed.fats_g, 'fats_g'),
        micronutrients: this.getOptionalString(parsed.micronutrients),
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException('No se pudo interpretar el analisis IA');
    }
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

  private getRequiredNumber(value: unknown, field: string): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      throw new BadGatewayException(
        `El analisis IA no incluyo un numero valido para ${field}`,
      );
    }

    return Math.round(numberValue);
  }
}
