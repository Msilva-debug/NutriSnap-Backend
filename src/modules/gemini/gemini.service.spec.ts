import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  let service: GeminiService;

  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    service = new GeminiService();
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  it('reports whether a non-empty API key is configured', () => {
    expect(service.hasApiKey()).toBe(false);

    process.env.GEMINI_API_KEY = '   ';
    expect(service.hasApiKey()).toBe(false);

    process.env.GEMINI_API_KEY = ' test-key ';
    expect(service.hasApiKey()).toBe(true);
  });

  it('rejects generation when the API key is absent', async () => {
    await expect(
      service.generateContent({}, { missingApiKeyMessage: 'Falta la llave' }),
    ).rejects.toThrow('Falta la llave');
  });

  it('calls Gemini with the selected model and returns generated text', async () => {
    process.env.GEMINI_API_KEY = 'secret-key';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'respuesta' }] } }],
      }),
    } as unknown as Response);
    const body = { contents: [{ parts: [{ text: 'hola' }] }] };

    await expect(
      service.generateContent(body, { model: 'gemini-test' }),
    ).resolves.toBe('respuesta');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent?key=secret-key',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  });

  it('uses the provider error message for failed HTTP responses', async () => {
    process.env.GEMINI_API_KEY = 'secret-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: { message: 'Cuota agotada' },
      }),
    } as unknown as Response);

    await expect(service.generateContent({})).rejects.toThrow('Cuota agotada');
  });

  it('uses the configured fallback when an error body is unreadable', async () => {
    process.env.GEMINI_API_KEY = 'secret-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    } as unknown as Response);

    await expect(
      service.generateContent({}, { errorMessage: 'Gemini no disponible' }),
    ).rejects.toThrow('Gemini no disponible');
  });

  it('rejects a successful response without generated text', async () => {
    process.env.GEMINI_API_KEY = 'secret-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ candidates: [] }),
    } as unknown as Response);

    await expect(
      service.generateContent({}, { unexpectedTextMessage: 'Respuesta vacia' }),
    ).rejects.toThrow('Respuesta vacia');
  });
});
