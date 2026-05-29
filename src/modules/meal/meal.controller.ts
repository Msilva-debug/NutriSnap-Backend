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
} from '@nestjs/common';
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

  @Get('today')
  @ApiOperation({ summary: 'Obtener las comidas del dia de hoy' })
  @ApiResponse({ status: 200, description: 'Listado de comidas de hoy' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findToday() {
    return this.mealService.findToday();
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
