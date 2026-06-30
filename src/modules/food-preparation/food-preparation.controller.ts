import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyzeFoodPreparationDto } from './dto/analyze-food-preparation.dto';
import { CreateFoodPreparationDto } from './dto/create-food-preparation.dto';
import { CreateMealFromPreparationDto } from './dto/create-meal-from-preparation.dto';
import { UpdateFoodPreparationDto } from './dto/update-food-preparation.dto';
import { FoodPreparation } from './entities/food-preparation.entity';
import { FoodPreparationAiService } from './food-preparation-ai.service';
import { FoodPreparationService } from './food-preparation.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('preparaciones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('food-preparations')
export class FoodPreparationController {
  constructor(
    private readonly foodPreparationService: FoodPreparationService,
    private readonly foodPreparationAiService: FoodPreparationAiService,
  ) {}

  @Post('analyze')
  @ApiOperation({
    summary:
      'Analizar una preparacion escrita o dictada y estimar nutrientes con IA',
  })
  @ApiResponse({
    status: 201,
    description: 'Analisis de preparacion generado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Descripcion invalida' })
  analyze(@Body() analyzeFoodPreparationDto: AnalyzeFoodPreparationDto) {
    return this.foodPreparationAiService.analyze(analyzeFoodPreparationDto);
  }

  @Post()
  @ApiOperation({ summary: 'Guardar una preparacion reutilizable' })
  @ApiResponse({
    status: 201,
    description: 'Preparacion guardada correctamente',
    type: FoodPreparation,
  })
  create(
    @Body() createFoodPreparationDto: CreateFoodPreparationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.foodPreparationService.create(
      request.user.id,
      createFoodPreparationDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar preparaciones guardadas del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Listado de preparaciones guardadas',
    type: [FoodPreparation],
  })
  findAll(@Req() request: AuthenticatedRequest) {
    return this.foodPreparationService.findAll(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una preparacion guardada por ID' })
  @ApiResponse({
    status: 200,
    description: 'Preparacion encontrada',
    type: FoodPreparation,
  })
  @ApiResponse({ status: 404, description: 'Preparacion no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.foodPreparationService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una preparacion guardada' })
  @ApiResponse({
    status: 200,
    description: 'Preparacion actualizada correctamente',
    type: FoodPreparation,
  })
  @ApiResponse({ status: 404, description: 'Preparacion no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodPreparationDto: UpdateFoodPreparationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.foodPreparationService.update(
      id,
      request.user.id,
      updateFoodPreparationDto,
    );
  }

  @Post(':id/meal')
  @ApiOperation({
    summary: 'Registrar una comida usando una preparacion guardada',
  })
  @ApiResponse({
    status: 201,
    description: 'Comida registrada correctamente desde la preparacion',
  })
  @ApiResponse({ status: 404, description: 'Preparacion no encontrada' })
  createMealFromPreparation(
    @Param('id', ParseIntPipe) id: number,
    @Body() createMealFromPreparationDto: CreateMealFromPreparationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.foodPreparationService.createMealFromPreparation(
      id,
      request.user.id,
      createMealFromPreparationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar una preparacion guardada' })
  @ApiResponse({
    status: 200,
    description: 'Preparacion desactivada correctamente',
    type: FoodPreparation,
  })
  @ApiResponse({ status: 404, description: 'Preparacion no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.foodPreparationService.remove(id, request.user.id);
  }
}
