import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ActivityLevel,
  ActivityLevelValue,
} from '../activity-level/entities/activity-level.entity';
import {
  NutritionPlan,
  UserGoal,
} from '../nutrition-plan/entities/nutrition-plan.entity';
import { NutritionPlanService } from '../nutrition-plan/nutrition-plan.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;

  const userRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const activityLevelRepository = {
    findOne: jest.fn(),
  };
  const nutritionPlanRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        NutritionPlanService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(ActivityLevel),
          useValue: activityLevelRepository,
        },
        {
          provide: getRepositoryToken(NutritionPlan),
          useValue: nutritionPlanRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  const expectedPlanByGoal = [
    {
      goal: UserGoal.LOSE_FAT,
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2201,
      proteinGoal: 140,
      carbsGoal: 273,
      fatsGoal: 61,
    },
    {
      goal: UserGoal.GAIN_MUSCLE,
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2848,
      proteinGoal: 140,
      carbsGoal: 394,
      fatsGoal: 79,
    },
    {
      goal: UserGoal.BODY_RECOMPOSITION,
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2460,
      proteinGoal: 126,
      carbsGoal: 336,
      fatsGoal: 68,
    },
    {
      goal: UserGoal.MAINTAIN_WEIGHT,
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2589,
      proteinGoal: 112,
      carbsGoal: 373,
      fatsGoal: 72,
    },
    {
      goal: UserGoal.IMPROVE_HABITS,
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2589,
      proteinGoal: 112,
      carbsGoal: 373,
      fatsGoal: 72,
    },
  ];

  it('prints the expected nutrition plan table for every goal', () => {
    console.table(
      expectedPlanByGoal.map((plan) => ({
        goal: plan.goal,
        basalKcal: plan.basalMetabolicRate,
        maintenanceKcal: plan.maintenanceCalories,
        dailyGoalKcal: plan.dailyCalorieGoal,
        proteinGrams: plan.proteinGoal,
        carbsGrams: plan.carbsGoal,
        fatsGrams: plan.fatsGoal,
      })),
    );

    expect(expectedPlanByGoal).toHaveLength(Object.values(UserGoal).length);
  });

  it.each(expectedPlanByGoal)(
    'creates a user and generates a nutrition plan for $goal',
    async ({
      goal,
      basalMetabolicRate,
      maintenanceCalories,
      dailyCalorieGoal,
      proteinGoal,
      carbsGoal,
      fatsGoal,
    }) => {
      const createUserDto: CreateUserDto = {
        email: `${goal}@example.com`,
        name: 'Mateo Celis',
        password: 'Mateosilva01',
        confirmPassword: 'Mateosilva01',
        birthdate: '2000-01-01',
        age: 26,
        weight: 70,
        height: 175,
        sex: 'masculino',
        goal,
        activityLevel: ActivityLevelValue.MODERATE,
        primaryColor: '#6d28d9',
        secondaryColor: '#ecfeff',
      };
      const activityLevel = {
        id: 3,
        value: ActivityLevelValue.MODERATE,
        label: 'Moderado',
        description: '3-5 dias/semana',
      };

      activityLevelRepository.findOne.mockResolvedValue(activityLevel);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((user) => user);
      userRepository.save.mockImplementation((user) =>
        Promise.resolve({
          id: 1,
          ...user,
        }),
      );
      nutritionPlanRepository.findOne.mockResolvedValue(null);
      nutritionPlanRepository.create.mockImplementation((plan) => plan);
      nutritionPlanRepository.save.mockImplementation((plan) =>
        Promise.resolve({
          id: 1,
          ...plan,
        }),
      );

      const user = await usersService.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          name: createUserDto.name,
          age: createUserDto.age,
          weight: createUserDto.weight,
          height: createUserDto.height,
          sex: createUserDto.sex,
          primaryColor: createUserDto.primaryColor,
          secondaryColor: createUserDto.secondaryColor,
          activityLevelId: activityLevel.id,
        }),
      );
      expect(nutritionPlanRepository.create).toHaveBeenCalledWith({
        userId: 1,
        goal,
        basalMetabolicRate,
        maintenanceCalories,
        dailyCalorieGoal,
        proteinGoal,
        carbsGoal,
        fatsGoal,
      });
      expect(user).toEqual(
        expect.objectContaining({
          id: 1,
          email: createUserDto.email,
          nutritionPlan: expect.objectContaining({
            userId: 1,
            goal,
            dailyCalorieGoal,
            proteinGoal,
            carbsGoal,
            fatsGoal,
          }),
        }),
      );
    },
  );

  it('returns a success message when the email is available', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      usersService.validateEmail('nuevo@example.com'),
    ).resolves.toEqual({
      message: 'Correo electronico disponible',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'nuevo@example.com' },
    });
  });

  it('throws a bad request when the email is already registered', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'registrado@example.com',
    });

    await expect(
      usersService.validateEmail('registrado@example.com'),
    ).rejects.toThrow('El correo electronico ya esta registrado');
  });
});
