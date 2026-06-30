import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMealDto } from './dto/create-meal.dto';
import { SaveMealHistoryNoteDto } from './dto/save-meal-history-note.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { DailyFoodNote } from './entities/daily-food-note.entity';
import { Meal, MealType } from './entities/meal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealGateway } from './meal.gateway';
import { FoodTextEmbeddingService } from '../food-embedding/food-text-embedding.service';

export interface MealHistoryResponse {
  date: string;
  meals: Meal[];
  note: string;
  noteId: number | null;
}

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(DailyFoodNote)
    private readonly dailyFoodNoteRepository: Repository<DailyFoodNote>,
    private readonly mealGateway: MealGateway,
    private readonly foodTextEmbeddingService: FoodTextEmbeddingService,
  ) {}

  async create(
    createMealDto: CreateMealDto,
    userId: number,
    foodPreparationId?: number,
  ): Promise<Meal> {
    this.validateMealType(createMealDto.type);
    const now = new Date();

    const meal = this.mealRepository.create({
      name: createMealDto.name,
      calories: Number(createMealDto.calories),
      time: this.formatServerTime(now),
      date: this.formatServerDate(now),
      type: createMealDto.type,
      userId,
      foodPreparationId,
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

    const savedMeal = await this.mealRepository.save(meal);

    this.mealGateway.emitMealCreated(userId, savedMeal);

    return savedMeal;
  }

  findAll(userId: number): Promise<Meal[]> {
    return this.mealRepository.find({
      where: { userId },
    });
  }

  findToday(userId: number): Promise<Meal[]> {
    return this.mealRepository.find({
      where: {
        userId,
        date: this.formatServerDate(new Date()),
      },
    });
  }

  async findByDate(userId: number, date: string): Promise<MealHistoryResponse> {
    const formattedDate = this.validateHistoryDate(date);
    const [meals, dailyFoodNote] = await Promise.all([
      this.mealRepository.find({
        where: {
          userId,
          date: formattedDate,
        },
        order: {
          time: 'ASC',
        },
      }),
      this.dailyFoodNoteRepository.findOne({
        where: {
          userId,
          date: formattedDate,
        },
      }),
    ]);

    return {
      date: formattedDate,
      meals,
      note: dailyFoodNote?.note ?? '',
      noteId: dailyFoodNote?.id ?? null,
    };
  }

  async findOne(id: number, userId: number): Promise<Meal> {
    const meal = await this.mealRepository.findOne({ where: { id, userId } });

    if (!meal) {
      throw new NotFoundException(`Comida #${id} no encontrada`);
    }

    return meal;
  }

  async update(
    id: number,
    updateMealDto: UpdateMealDto,
    userId: number,
  ): Promise<Meal> {
    const meal = await this.findOne(id, userId);

    if (updateMealDto.type !== undefined) {
      this.validateMealType(updateMealDto.type);
    }

    const updatedMeal = this.mealRepository.merge(meal, {
      name: updateMealDto.name ?? meal.name,
      type: updateMealDto.type ?? meal.type,
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

  async remove(id: number, userId: number): Promise<Meal> {
    const meal = await this.findOne(id, userId);

    return this.mealRepository.remove(meal);
  }

  async saveHistoryNote(
    userId: number,
    saveMealHistoryNoteDto: SaveMealHistoryNoteDto,
  ): Promise<DailyFoodNote> {
    const date = this.validateHistoryDate(saveMealHistoryNoteDto.date);
    const note = this.validateHistoryNote(saveMealHistoryNoteDto.note);
    const existingNote = await this.dailyFoodNoteRepository.findOne({
      where: {
        userId,
        date,
      },
    });

    const dailyFoodNote = existingNote
      ? this.dailyFoodNoteRepository.merge(existingNote, { note })
      : this.dailyFoodNoteRepository.create({
          userId,
          date,
          note,
        });

    const savedNote = await this.dailyFoodNoteRepository.save(dailyFoodNote);

    await this.foodTextEmbeddingService.upsertDailyNoteEmbedding(savedNote);

    return savedNote;
  }

  private validateMealType(type: MealType): void {
    if (!Object.values(MealType).includes(type)) {
      throw new BadRequestException('El tipo de comida es invalido');
    }
  }

  private validateHistoryDate(date: string): string {
    if (!date?.trim()) {
      throw new BadRequestException('La fecha es requerida');
    }

    const formattedDate = date.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
    }

    const parsedDate = new Date(`${formattedDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== formattedDate
    ) {
      throw new BadRequestException('La fecha es invalida');
    }

    return formattedDate;
  }

  private validateHistoryNote(note: string): string {
    if (typeof note !== 'string') {
      throw new BadRequestException('La nota debe ser texto');
    }

    if (note.length > 5000) {
      throw new BadRequestException('La nota no puede superar 5000 caracteres');
    }

    return note.trim();
  }

  private formatServerTime(date: Date): string {
    return date.toTimeString().slice(0, 8);
  }

  private formatServerDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
