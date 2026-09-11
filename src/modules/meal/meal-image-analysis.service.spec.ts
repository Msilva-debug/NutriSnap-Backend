import { GeminiService } from '../gemini/gemini.service';
import {
  MealImageAnalysisService,
  UploadedMealImage,
} from './meal-image-analysis.service';

describe('MealImageAnalysisService', () => {
  const generateContent = jest.fn<
    Promise<string>,
    [Record<string, unknown>, Record<string, string>?]
  >();
  const geminiService = { generateContent };
  const service = new MealImageAnalysisService(
    geminiService as unknown as GeminiService,
  );
  const image: UploadedMealImage = {
    buffer: Buffer.from('image-content'),
    mimetype: 'image/jpeg',
    originalname: 'meal.jpg',
    size: 13,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the encoded image to Gemini and normalizes its JSON', async () => {
    let capturedRequest: Record<string, unknown> = {};
    generateContent.mockImplementation((body: Record<string, unknown>) => {
      capturedRequest = body;

      return Promise.resolve(`\`\`\`json
      {
        "name": " Pollo con arroz ",
        "calories": 650.4,
        "proteins_g": "42",
        "carbs_g": 73.6,
        "fats_g": 18.2,
        "micronutrients": " Hierro y fibra "
      }
    \`\`\``);
    });

    await expect(service.analyze(image)).resolves.toEqual({
      name: 'Pollo con arroz',
      calories: 650,
      proteins_g: 42,
      carbs_g: 74,
      fats_g: 18,
      micronutrients: 'Hierro y fibra',
    });

    const request = capturedRequest as unknown as {
      contents: Array<{ parts: Array<{ inline_data?: { data: string } }> }>;
    };
    expect(request.contents[0].parts[0].inline_data).toEqual({
      mime_type: 'image/jpeg',
      data: image.buffer.toString('base64'),
    });
    expect(geminiService.generateContent).toHaveBeenCalledWith(
      expect.any(Object),
      {
        errorMessage: 'Error al llamar al analizador IA',
        unexpectedTextMessage: 'Respuesta inesperada del analizador IA',
      },
    );
  });

  it.each([
    [{ ...image, buffer: Buffer.alloc(0) }, 'La imagen es requerida'],
    [{ ...image, mimetype: 'image/gif' }, 'JPG, PNG o WEBP'],
  ])('rejects an invalid image', async (invalidImage, message) => {
    await expect(service.analyze(invalidImage)).rejects.toThrow(message);
    expect(geminiService.generateContent).not.toHaveBeenCalled();
  });

  it.each([
    ['not-json', 'No se pudo interpretar el analisis IA'],
    [
      JSON.stringify({
        name: '',
        calories: 1,
        proteins_g: 1,
        carbs_g: 1,
        fats_g: 1,
      }),
      'valor valido para name',
    ],
    [
      JSON.stringify({
        name: 'Comida',
        calories: -1,
        proteins_g: 1,
        carbs_g: 1,
        fats_g: 1,
      }),
      'numero valido para calories',
    ],
  ])('rejects an invalid Gemini analysis', async (text, message) => {
    geminiService.generateContent.mockResolvedValue(text);

    await expect(service.analyze(image)).rejects.toThrow(message);
  });

  it('uses an empty micronutrient description when Gemini omits it', async () => {
    geminiService.generateContent.mockResolvedValue(
      JSON.stringify({
        name: 'Fruta',
        calories: 80,
        proteins_g: 1,
        carbs_g: 20,
        fats_g: 0,
      }),
    );

    await expect(service.analyze(image)).resolves.toEqual(
      expect.objectContaining({ micronutrients: '' }),
    );
  });
});
