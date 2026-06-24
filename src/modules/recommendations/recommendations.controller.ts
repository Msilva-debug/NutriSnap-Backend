import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
    enum: ['daily', 'monthly', 'range'],
    description: 'Periodo a analizar',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-06-17',
    description: 'Requerido cuando period=daily. Formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2026-06',
    description: 'Requerido cuando period=monthly. Formato YYYY-MM.',
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
          enum: ['daily', 'monthly', 'range'],
          example: 'range',
        },
        summary: {
          type: 'string',
          example:
            'Encontramos 18 comidas registradas en el periodo seleccionado.',
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
      required: ['period', 'recommendations'],
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
}
