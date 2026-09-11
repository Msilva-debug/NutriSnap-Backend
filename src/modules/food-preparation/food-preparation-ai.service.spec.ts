import { GeminiService } from '../gemini/gemini.service';
import { FoodPreparationAiService } from './food-preparation-ai.service';

describe('FoodPreparationAiService', () => {
  const generateContent = jest.fn<
    Promise<string>,
    [Record<string, unknown>, Record<string, string>?]
  >();
  const geminiService = { generateContent };
  const service = new FoodPreparationAiService(
    geminiService as unknown as GeminiService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes a fenced Gemini response and includes supplied servings', async () => {
    let capturedRequest: Record<string, unknown> = {};
    generateContent.mockImplementation((body: Record<string, unknown>) => {
      capturedRequest = body;

      return Promise.resolve(`\`\`\`
      {
        "name": " Galletas de avena ",
        "description": " Avena, huevo y leche ",
        "servings": 6.2,
        "caloriesPerServing": 145.4,
        "proteinsPerServing": 5.26,
        "carbsPerServing": "22.14",
        "fatsPerServing": 4.05,
        "micronutrients": " Fibra ",
        "notes": " Estimado "
      }
    \`\`\``);
    });

    await expect(
      service.analyze({ description: ' receta de avena ', servings: 6 }),
    ).resolves.toEqual({
      name: 'Galletas de avena',
      description: 'Avena, huevo y leche',
      servings: 6,
      caloriesPerServing: 145,
      proteinsPerServing: 5.3,
      carbsPerServing: 22.1,
      fatsPerServing: 4.1,
      micronutrients: 'Fibra',
      notes: 'Estimado',
    });

    const request = capturedRequest as unknown as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(request.contents[0].parts[0].text).toContain(
      'Porciones enviadas por el frontend: 6',
    );
    expect(request.contents[0].parts[0].text).toContain('receta de avena');
  });

  it.each([
    [{ description: '' }, 'descripcion de la preparacion es requerida'],
    [
      { description: 'x'.repeat(8001) },
      'descripcion no puede superar 8000 caracteres',
    ],
    [
      { description: 'Receta', servings: 1.5 },
      'porciones deben ser un numero entero mayor a 0',
    ],
  ])('rejects invalid input before calling Gemini', async (input, message) => {
    await expect(service.analyze(input)).rejects.toThrow(message);
    expect(geminiService.generateContent).not.toHaveBeenCalled();
  });

  it.each([
    ['bad-json', 'No se pudo interpretar el analisis de preparacion'],
    [
      JSON.stringify({
        name: 'Receta',
        description: '',
        servings: 2,
        caloriesPerServing: 100,
        proteinsPerServing: 2,
        carbsPerServing: 10,
        fatsPerServing: 3,
      }),
      'valor valido para description',
    ],
    [
      JSON.stringify({
        name: 'Receta',
        description: 'Descripcion',
        servings: 0,
        caloriesPerServing: 100,
        proteinsPerServing: 2,
        carbsPerServing: 10,
        fatsPerServing: 3,
      }),
      'numero valido para servings',
    ],
  ])('rejects invalid AI output', async (text, message) => {
    geminiService.generateContent.mockResolvedValue(text);

    await expect(service.analyze({ description: 'Receta' })).rejects.toThrow(
      message,
    );
  });

  it('allows omitted frontend servings and optional AI strings', async () => {
    let capturedRequest: Record<string, unknown> = {};
    generateContent.mockImplementation((body: Record<string, unknown>) => {
      capturedRequest = body;

      return Promise.resolve(
        JSON.stringify({
          name: 'Sopa',
          description: 'Sopa casera',
          servings: 4,
          caloriesPerServing: 200,
          proteinsPerServing: 8,
          carbsPerServing: 30,
          fatsPerServing: 5,
        }),
      );
    });

    const result = await service.analyze({ description: 'Sopa' });

    expect(result).toEqual(
      expect.objectContaining({ micronutrients: '', notes: '' }),
    );
    const request = capturedRequest as unknown as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(request.contents[0].parts[0].text).toContain(
      'Porciones enviadas por el frontend: no especificadas',
    );
  });
});
