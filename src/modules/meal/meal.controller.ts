import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('comidas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  create(
    @Body() createMealDto: CreateMealDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.create(createMealDto, request.user.id);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.mealService.findAll(request.user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Obtener las comidas del dia de hoy' })
  @ApiResponse({ status: 200, description: 'Listado de comidas de hoy' })
  findToday(@Req() request: AuthenticatedRequest) {
    return this.mealService.findToday(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida encontrada' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMealDto: UpdateMealDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.update(id, updateMealDto, request.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.remove(id, request.user.id);
  }
}
