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

@ApiTags('meals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meal' })
  @ApiResponse({ status: 201, description: 'Meal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  create(@Body() createMealDto: CreateMealDto) {
    return this.mealService.create(createMealDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meals' })
  @ApiResponse({ status: 200, description: 'List of all meals' })
  findAll() {
    return this.mealService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meal by ID' })
  @ApiResponse({ status: 200, description: 'Meal found' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  findOne(@Param('id') id: string) {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meal by ID' })
  @ApiResponse({ status: 200, description: 'Meal updated successfully' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  update(@Param('id') id: string, @Body() updateMealDto: UpdateMealDto) {
    return this.mealService.update(id, updateMealDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meal by ID' })
  @ApiResponse({ status: 200, description: 'Meal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  remove(@Param('id') id: string) {
    return this.mealService.remove(id);
  }
}
