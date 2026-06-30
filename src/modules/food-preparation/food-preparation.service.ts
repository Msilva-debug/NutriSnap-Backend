import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMealDto } from '../meal/dto/create-meal.dto';
import { Meal, MealType } from '../meal/entities/meal.entity';
import { MealService } from '../meal/meal.service';
import { CreateFoodPreparationDto } from './dto/create-food-preparation.dto';
import { CreateMealFromPreparationDto } from './dto/create-meal-from-preparation.dto';
import { UpdateFoodPreparationDto } from './dto/update-food-preparation.dto';
import {
  FoodPreparation,
  FoodPreparationStatus,
} from './entities/food-preparation.entity';

@Injectable()
export class FoodPreparationService {
  constructor(
    @InjectRepository(FoodPreparation)
    private readonly foodPreparationRepository: Repository<FoodPreparation>,
    private readonly mealService: MealService,
  ) {}

  create(
    userId: number,
    createFoodPreparationDto: CreateFoodPreparationDto,
  ): Promise<FoodPreparation> {
    const preparedData = this.validatePreparationData(
      createFoodPreparationDto,
    );
    const foodPreparation = this.foodPreparationRepository.create({
      ...preparedData,
      userId,
    });

    return this.foodPreparationRepository.save(foodPreparation);
  }

  findAll(userId: number): Promise<FoodPreparation[]> {
    return this.foodPreparationRepository.find({
      where: {
        userId,
        status: FoodPreparationStatus.ACTIVE,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findOne(id: number, userId: number): Promise<FoodPreparation> {
    const foodPreparation = await this.foodPreparationRepository.findOne({
      where: {
        id,
        userId,
        status: FoodPreparationStatus.ACTIVE,
      },
    });

    if (!foodPreparation) {
      throw new NotFoundException(`Preparacion #${id} no encontrada`);
    }

    return foodPreparation;
  }

  async update(
    id: number,
    userId: number,
    updateFoodPreparationDto: UpdateFoodPreparationDto,
  ): Promise<FoodPreparation> {
    const foodPreparation = await this.findOne(id, userId);
    const preparedData = this.validatePreparationData(
      updateFoodPreparationDto,
      foodPreparation,
    );
    const updatedFoodPreparation = this.foodPreparationRepository.merge(
      foodPreparation,
      preparedData,
    );

    return this.foodPreparationRepository.save(updatedFoodPreparation);
  }

  async remove(id: number, userId: number): Promise<FoodPreparation> {
    const foodPreparation = await this.findOne(id, userId);
    const inactiveFoodPreparation = this.foodPreparationRepository.merge(
      foodPreparation,
      {
        status: FoodPreparationStatus.INACTIVE,
      },
    );

    return this.foodPreparationRepository.save(inactiveFoodPreparation);
  }

  async createMealFromPreparation(
    id: number,
    userId: number,
    createMealFromPreparationDto: CreateMealFromPreparationDto,
  ): Promise<Meal> {
    const foodPreparation = await this.findOne(id, userId);
    const servings = this.validateServings(
      createMealFromPreparationDto.servings ?? 1,
    );

    this.validateMealType(createMealFromPreparationDto.type);

    const createMealDto: CreateMealDto = {
      name: this.buildMealName(foodPreparation.name, servings),
      calories: Math.round(foodPreparation.caloriesPerServing * servings),
      proteins: this.roundMacro(foodPreparation.proteinsPerServing * servings),
      carbs: this.roundMacro(foodPreparation.carbsPerServing * servings),
      fats: this.roundMacro(foodPreparation.fatsPerServing * servings),
      type: createMealFromPreparationDto.type,
    };

    return this.mealService.create(createMealDto, userId, foodPreparation.id);
  }

  private validatePreparationData(
    foodPreparationDto:
      | CreateFoodPreparationDto
      | UpdateFoodPreparationDto,
    currentFoodPreparation?: FoodPreparation,
  ): CreateFoodPreparationDto {
    const mergedData = {
      name: foodPreparationDto.name ?? currentFoodPreparation?.name,
      description:
        foodPreparationDto.description ?? currentFoodPreparation?.description,
      servings: foodPreparationDto.servings ?? currentFoodPreparation?.servings,
      caloriesPerServing:
        foodPreparationDto.caloriesPerServing ??
        currentFoodPreparation?.caloriesPerServing,
      proteinsPerServing:
        foodPreparationDto.proteinsPerServing ??
        currentFoodPreparation?.proteinsPerServing,
      carbsPerServing:
        foodPreparationDto.carbsPerServing ??
        currentFoodPreparation?.carbsPerServing,
      fatsPerServing:
        foodPreparationDto.fatsPerServing ??
        currentFoodPreparation?.fatsPerServing,
      micronutrients:
        foodPreparationDto.micronutrients ??
        currentFoodPreparation?.micronutrients,
      notes: foodPreparationDto.notes ?? currentFoodPreparation?.notes,
    };

    return {
      name: this.validateText(mergedData.name, 'El nombre', 120),
      description: this.validateText(
        mergedData.description,
        'La descripcion',
        8000,
      ),
      servings: this.validateServings(mergedData.servings),
      caloriesPerServing: this.validateNumber(
        mergedData.caloriesPerServing,
        'Las calorias por porcion',
        true,
      ),
      proteinsPerServing: this.validateNumber(
        mergedData.proteinsPerServing,
        'Las proteinas por porcion',
      ),
      carbsPerServing: this.validateNumber(
        mergedData.carbsPerServing,
        'Los carbohidratos por porcion',
      ),
      fatsPerServing: this.validateNumber(
        mergedData.fatsPerServing,
        'Las grasas por porcion',
      ),
      micronutrients: this.validateOptionalText(
        mergedData.micronutrients,
        'Los micronutrientes',
        2000,
      ),
      notes: this.validateOptionalText(mergedData.notes, 'Las notas', 2000),
    };
  }

  private validateText(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} es requerido`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${maxLength} caracteres`,
      );
    }

    return trimmedValue;
  }

  private validateOptionalText(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} debe ser texto`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${maxLength} caracteres`,
      );
    }

    return trimmedValue || undefined;
  }

  private validateServings(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(
        'Las porciones deben ser un numero entero mayor a 0',
      );
    }

    return numberValue;
  }

  private validateNumber(
    value: unknown,
    fieldName: string,
    shouldRound = false,
  ): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      throw new BadRequestException(`${fieldName} debe ser un numero positivo`);
    }

    return shouldRound
      ? Math.round(numberValue)
      : Math.round(numberValue * 10) / 10;
  }

  private validateMealType(type: MealType): void {
    if (!Object.values(MealType).includes(type)) {
      throw new BadRequestException('El tipo de comida es invalido');
    }
  }

  private buildMealName(name: string, servings: number): string {
    if (servings === 1) {
      return name;
    }

    return `${name} (${servings} porciones)`;
  }

  private roundMacro(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
