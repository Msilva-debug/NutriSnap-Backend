import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@ApiTags('comidas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva comida' })
  @ApiResponse({ status: 201, description: 'Comida creada correctamente' })
  @ApiResponse({ status: 400, description: 'Cuerpo de solicitud invalido' })
  create(@Body() createMealDto: CreateMealDto) {
    return this.mealService.create(createMealDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las comidas' })
  @ApiResponse({ status: 200, description: 'Listado de comidas' })
  findAll() {
    return this.mealService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida encontrada' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  findOne(@Param('id') id: string) {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  update(@Param('id') id: string, @Body() updateMealDto: UpdateMealDto) {
    return this.mealService.update(id, updateMealDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  remove(@Param('id') id: string) {
    return this.mealService.remove(id);
  }
}
