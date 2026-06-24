import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

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

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
  };
}

@Injectable()
export class MealImageAnalysisService {
  private readonly geminiApiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  async analyze(image: UploadedMealImage): Promise<FoodAnalysisResult> {
    this.validateImage(image);

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY no esta configurada en el servidor',
      );
    }

    const response = await fetch(`${this.geminiApiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildGeminiRequest(image)),
    });

    if (!response.ok) {
      throw new BadGatewayException(
        await this.getGeminiErrorMessage(response),
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new BadGatewayException('Respuesta inesperada del analizador IA');
    }

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
              text: `Analiza esta imagen de comida y proporciona la informacion nutricional en JSON con el siguiente formato exacto:
{
  "name": "nombre del plato",
  "calories": numero de calorias,
  "proteins_g": gramos de proteina,
  "carbs_g": gramos de carbohidratos,
  "fats_g": gramos de grasas,
  "micronutrients": "lista de micronutrientes principales"
}

Se detallado y realista en tus calculos. Solo devuelve el JSON, sin explicaciones adicionales.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
  }

  private async getGeminiErrorMessage(response: Response): Promise<string> {
    try {
      const error = (await response.json()) as GeminiErrorResponse;

      return error.error?.message ?? 'Error al llamar al analizador IA';
    } catch {
      return 'Error al llamar al analizador IA';
    }
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
