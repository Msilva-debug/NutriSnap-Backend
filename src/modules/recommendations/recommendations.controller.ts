import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RecommendationsService } from './recommendations.service';
import type { GetRecommendationsQuery } from './recommendation.types';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

const embeddingsBackfillResponseSchema = {
  type: 'object',
  properties: {
    dailyNotes: {
      type: 'number',
      example: 17,
    },
  },
  required: ['dailyNotes'],
};

@ApiTags('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener recomendaciones nutricionales por periodo',
  })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['daily', 'range'],
    description: 'Periodo a analizar',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-06-17',
    description: 'Requerido cuando period=daily. Formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    example: '2026-06-01',
    description: 'Requerido cuando period=range. Formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    example: '2026-06-17',
    description: 'Requerido cuando period=range. Formato YYYY-MM-DD.',
  })
  @ApiOkResponse({
    description: 'Recomendaciones generadas para el periodo solicitado',
    schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['daily', 'range'],
          example: 'range',
        },
        summary: {
          type: 'string',
          example:
            'Encontramos 18 comidas registradas en el periodo seleccionado.',
        },
        comparison: {
          type: 'object',
          properties: {
            available: {
              type: 'boolean',
              example: true,
            },
            summary: {
              type: 'string',
              example:
                'El segundo mes muestra mejor distribucion de comidas frente al primero, pero conviene seguir cuidando la variedad de verduras.',
            },
            improvements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    example: 'Proteina',
                  },
                  description: {
                    type: 'string',
                    example:
                      'En el segundo mes aparecen mas comidas con pollo, huevos o atun frente al primero.',
                  },
                },
                required: ['description'],
              },
            },
            needsAttention: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    example: 'Variedad',
                  },
                  description: {
                    type: 'string',
                    example:
                      'La presencia alta de arroz y pocas verduras se mantiene en ambos meses.',
                  },
                },
                required: ['description'],
              },
            },
            stablePatterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    example: 'Casero',
                  },
                  description: {
                    type: 'string',
                    example:
                      'La preferencia por comidas caseras se mantiene entre el primer y segundo mes.',
                  },
                },
                required: ['description'],
              },
            },
          },
          required: [
            'available',
            'summary',
            'improvements',
            'needsAttention',
            'stablePatterns',
          ],
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                example: 'Consistencia',
              },
              title: {
                type: 'string',
                example: 'Manten registros diarios',
              },
              description: {
                type: 'string',
                example:
                  'Registrar tus comidas todos los dias ayudara a que las recomendaciones sean mas precisas.',
              },
            },
            required: ['title', 'description'],
          },
        },
      },
      required: ['period', 'comparison', 'recommendations'],
    },
  })
  findRecommendations(
    @Query() query: GetRecommendationsQuery,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recommendationsService.getRecommendations(
      request.user.id,
      query,
    );
  }

  @Post('embeddings/backfill')
  @ApiOperation({
    summary: 'Generar embeddings para notas diarias existentes',
  })
  @ApiOkResponse({
    description: 'Embeddings generados para el usuario autenticado',
    schema: embeddingsBackfillResponseSchema,
  })
  backfillEmbeddings(@Req() request: AuthenticatedRequest) {
    return this.recommendationsService.backfillEmbeddings(request.user.id);
  }

  @Post('notes/embeddings/backfill')
  @ApiOperation({
    summary:
      'Pasar todas las notas diarias del usuario autenticado a la tabla de embeddings',
  })
  @ApiOkResponse({
    description:
      'Embeddings creados o actualizados desde todas las notas diarias del usuario autenticado',
    schema: embeddingsBackfillResponseSchema,
  })
  backfillNoteEmbeddings(@Req() request: AuthenticatedRequest) {
    return this.recommendationsService.backfillEmbeddings(request.user.id);
  }
}
