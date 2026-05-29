import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@ApiTags('comidas')
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  create(@Body() createMealDto: CreateMealDto) {
    return this.mealService.create(createMealDto);
  }

  @Get()
  findAll() {
    return this.mealService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida encontrada' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMealDto: UpdateMealDto,
  ) {
    return this.mealService.update(id, updateMealDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mealService.remove(id);
  }
}
