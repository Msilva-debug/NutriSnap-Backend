import { Meal, MealType } from '../meal/entities/meal.entity';
import { MealService } from '../meal/meal.service';
import { CreateFoodPreparationDto } from './dto/create-food-preparation.dto';
import {
  FoodPreparation,
  FoodPreparationStatus,
} from './entities/food-preparation.entity';
import { FoodPreparationService } from './food-preparation.service';

describe('FoodPreparationService', () => {
  const repository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };
  const mealService = { create: jest.fn() };
  const service = new FoodPreparationService(
    repository as never,
    mealService as unknown as MealService,
  );
  const createDto: CreateFoodPreparationDto = {
    name: ' Galletas de avena ',
    description: ' Avena, huevo y leche ',
    servings: 6,
    caloriesPerServing: 145.4,
    proteinsPerServing: 5.26,
    carbsPerServing: 22.14,
    fatsPerServing: 4.05,
    micronutrients: ' Fibra ',
    notes: ' Estimado ',
  };
  const preparation = {
    id: 4,
    userId: 9,
    name: 'Galletas de avena',
    description: 'Avena, huevo y leche',
    status: FoodPreparationStatus.ACTIVE,
    servings: 6,
    caloriesPerServing: 145,
    proteinsPerServing: 5.3,
    carbsPerServing: 22.1,
    fatsPerServing: 4.1,
    micronutrients: 'Fibra',
    notes: 'Estimado',
  } as FoodPreparation;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.create.mockImplementation((value: FoodPreparation) => value);
    repository.merge.mockImplementation(
      (entity: FoodPreparation, value: Partial<FoodPreparation>) => ({
        ...entity,
        ...value,
      }),
    );
    repository.save.mockImplementation((value: FoodPreparation) =>
      Promise.resolve(value),
    );
  });

  it('validates, trims and rounds preparation data before saving', async () => {
    await expect(service.create(9, createDto)).resolves.toEqual({
      userId: 9,
      name: 'Galletas de avena',
      description: 'Avena, huevo y leche',
      servings: 6,
      caloriesPerServing: 145,
      proteinsPerServing: 5.3,
      carbsPerServing: 22.1,
      fatsPerServing: 4.1,
      micronutrients: 'Fibra',
      notes: 'Estimado',
    });
  });

  it('converts blank optional fields to undefined', async () => {
    await service.create(9, {
      ...createDto,
      micronutrients: '',
      notes: '   ',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ micronutrients: undefined, notes: undefined }),
    );
  });

  it('lists only active preparations for the user', async () => {
    repository.find.mockResolvedValue([preparation]);

    await expect(service.findAll(9)).resolves.toEqual([preparation]);
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 9, status: FoodPreparationStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });
  });

  it('finds an active owned preparation or rejects it', async () => {
    repository.findOne
      .mockResolvedValueOnce(preparation)
      .mockResolvedValue(null);

    await expect(service.findOne(4, 9)).resolves.toBe(preparation);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 4, userId: 9, status: FoodPreparationStatus.ACTIVE },
    });
    await expect(service.findOne(404, 9)).rejects.toThrow(
      'Preparacion #404 no encontrada',
    );
  });

  it('merges partial updates with current validated data', async () => {
    repository.findOne.mockResolvedValue(preparation);

    await expect(
      service.update(4, 9, {
        name: ' Galletas nuevas ',
        caloriesPerServing: 160,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'Galletas nuevas',
        caloriesPerServing: 160,
        description: preparation.description,
      }),
    );
  });

  it('soft-deletes a preparation by marking it inactive', async () => {
    repository.findOne.mockResolvedValue(preparation);

    await expect(service.remove(4, 9)).resolves.toEqual(
      expect.objectContaining({ status: FoodPreparationStatus.INACTIVE }),
    );
    expect(repository.merge).toHaveBeenCalledWith(preparation, {
      status: FoodPreparationStatus.INACTIVE,
    });
  });

  it.each([
    [1, 'Galletas de avena', 145, 5.3, 22.1, 4.1],
    [2, 'Galletas de avena (2 porciones)', 290, 10.6, 44.2, 8.2],
  ])(
    'creates a meal for %i serving(s)',
    async (servings, name, calories, proteins, carbs, fats) => {
      const createdMeal = { id: 20 } as Meal;
      repository.findOne.mockResolvedValue(preparation);
      mealService.create.mockResolvedValue(createdMeal);

      await expect(
        service.createMealFromPreparation(4, 9, {
          type: MealType.SNACK,
          servings: servings === 1 ? undefined : servings,
        }),
      ).resolves.toBe(createdMeal);
      expect(mealService.create).toHaveBeenCalledWith(
        { name, calories, proteins, carbs, fats, type: MealType.SNACK },
        9,
        4,
      );
    },
  );

  it.each([
    [{ ...createDto, name: ' ' }, 'El nombre es requerido'],
    [
      { ...createDto, description: 'x'.repeat(8001) },
      'La descripcion no puede superar 8000 caracteres',
    ],
    [
      { ...createDto, servings: 1.5 },
      'Las porciones deben ser un numero entero mayor a 0',
    ],
    [
      { ...createDto, caloriesPerServing: -1 },
      'Las calorias por porcion debe ser un numero positivo',
    ],
    [
      { ...createDto, micronutrients: 123 as unknown as string },
      'Los micronutrientes debe ser texto',
    ],
  ])('rejects invalid preparation data', (dto, message) => {
    expect(() => service.create(9, dto)).toThrow(message);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid servings or meal type when creating a meal', async () => {
    repository.findOne.mockResolvedValue(preparation);

    await expect(
      service.createMealFromPreparation(4, 9, {
        type: MealType.SNACK,
        servings: 0,
      }),
    ).rejects.toThrow('Las porciones deben ser un numero entero mayor a 0');
    await expect(
      service.createMealFromPreparation(4, 9, {
        type: 'invalid' as MealType,
      }),
    ).rejects.toThrow('El tipo de comida es invalido');
    expect(mealService.create).not.toHaveBeenCalled();
  });
});
