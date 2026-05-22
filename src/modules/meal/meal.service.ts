import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal, MealType } from './entities/meal.entity';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
  ) {}

  async create(createMealDto: CreateMealDto): Promise<Meal> {
    this.validateMealType(createMealDto.type);

    const meal = this.mealRepository.create({
      ...createMealDto,
      calories: Number(createMealDto.calories),
      proteins:
        createMealDto.proteins !== undefined
          ? Number(createMealDto.proteins)
          : undefined,
      carbs:
        createMealDto.carbs !== undefined
          ? Number(createMealDto.carbs)
          : undefined,
      fats:
        createMealDto.fats !== undefined
          ? Number(createMealDto.fats)
          : undefined,
    });

    return this.mealRepository.save(meal);
  }

  findAll(): Promise<Meal[]> {
    return this.mealRepository.find();
  }

  async findOne(id: string): Promise<Meal> {
    const meal = await this.mealRepository.findOne({ where: { id } });

    if (!meal) {
      throw new NotFoundException(`Meal #${id} not found`);
    }

    return meal;
  }

  async update(id: string, updateMealDto: UpdateMealDto): Promise<Meal> {
    const meal = await this.findOne(id);

    if (updateMealDto.type !== undefined) {
      this.validateMealType(updateMealDto.type);
    }

    const updatedMeal = this.mealRepository.merge(meal, {
      ...updateMealDto,
      calories:
        updateMealDto.calories !== undefined
          ? Number(updateMealDto.calories)
          : meal.calories,
      proteins:
        updateMealDto.proteins !== undefined
          ? Number(updateMealDto.proteins)
          : meal.proteins,
      carbs:
        updateMealDto.carbs !== undefined
          ? Number(updateMealDto.carbs)
          : meal.carbs,
      fats:
        updateMealDto.fats !== undefined
          ? Number(updateMealDto.fats)
          : meal.fats,
    });

    return this.mealRepository.save(updatedMeal);
  }

  async remove(id: string): Promise<Meal> {
    const meal = await this.findOne(id);

    return this.mealRepository.remove(meal);
  }

  private validateMealType(type: MealType): void {
    if (!Object.values(MealType).includes(type)) {
      throw new BadRequestException('Invalid meal type');
    }
  }
}
