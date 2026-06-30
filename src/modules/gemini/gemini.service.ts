import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

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

interface GenerateContentOptions {
  errorMessage?: string;
  missingApiKeyMessage?: string;
  model?: string;
  unexpectedTextMessage?: string;
}

@Injectable()
export class GeminiService {
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly defaultModel = 'gemini-2.5-flash';

  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  async generateContent(
    body: Record<string, unknown>,
    options: GenerateContentOptions = {},
  ): Promise<string> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new InternalServerErrorException(
        options.missingApiKeyMessage ??
          'GEMINI_API_KEY no esta configurada en el servidor',
      );
    }

    const response = await fetch(
      `${this.baseUrl}/${options.model ?? this.defaultModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(
        await this.getGeminiErrorMessage(response, options.errorMessage),
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new BadGatewayException(
        options.unexpectedTextMessage ?? 'Respuesta inesperada de Gemini',
      );
    }

    return text;
  }

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY?.trim() || undefined;
  }

  private async getGeminiErrorMessage(
    response: Response,
    fallbackMessage = 'Error al llamar a Gemini',
  ): Promise<string> {
    try {
      const error = (await response.json()) as GeminiErrorResponse;

      return error.error?.message ?? fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
}
