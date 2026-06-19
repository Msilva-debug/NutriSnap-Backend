import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLevel } from '../activity-level/entities/activity-level.entity';
import { hashPassword } from '../auth/password.utils';
import { UserGoal } from '../nutrition-plan/entities/nutrition-plan.entity';
import { NutritionPlanService } from '../nutrition-plan/nutrition-plan.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserThemeColorsDto } from './dto/update-user-theme-colors.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ActivityLevel)
    private readonly activityLevelRepository: Repository<ActivityLevel>,
    private readonly nutritionPlanService: NutritionPlanService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Las contrasenas no coinciden');
    }

    await this.validateEmail(createUserDto.email);

    const activityLevel = await this.activityLevelRepository.findOne({
      where: { value: createUserDto.activityLevel },
    });

    if (!activityLevel?.id) {
      throw new BadRequestException('Nivel de actividad invalido');
    }

    const age = Number(createUserDto.age);
    const weight = Number(createUserDto.weight);
    const height = Number(createUserDto.height);
    const goal = createUserDto.goal ?? UserGoal.MAINTAIN_WEIGHT;

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashPassword(createUserDto.password),
      name: createUserDto.name,
      birthdate: createUserDto.birthdate,
      age,
      weight,
      height,
      sex: createUserDto.sex,
      primaryColor: createUserDto.primaryColor,
      secondaryColor: createUserDto.secondaryColor,
      activityLevelId: activityLevel.id,
    });

    const savedUser = await this.userRepository.save(user);
    const nutritionPlan = await this.nutritionPlanService.createOrUpdateForUser(
      savedUser,
      createUserDto.activityLevel,
      goal,
    );

    return Object.assign(savedUser, { nutritionPlan });
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        activityLevelOption: true,
      },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { activityLevel, confirmPassword, password, goal, ...userData } =
      updateUserDto;

    Object.assign(user, {
      ...userData,
      age: userData.age !== undefined ? Number(userData.age) : user.age,
      weight:
        userData.weight !== undefined ? Number(userData.weight) : user.weight,
      height:
        userData.height !== undefined ? Number(userData.height) : user.height,
    });

    let activityLevelValue = activityLevel;

    if (activityLevel !== undefined) {
      const activityLevelOption = await this.activityLevelRepository.findOne({
        where: { value: activityLevel },
      });

      if (!activityLevelOption?.id) {
        throw new BadRequestException('Nivel de actividad invalido');
      }

      user.activityLevelId = activityLevelOption.id;
      activityLevelValue = activityLevelOption.value;
    }

    if (password !== undefined) {
      if (password !== confirmPassword) {
        throw new BadRequestException('Las contrasenas no coinciden');
      }

      user.password = hashPassword(password);
    }

    const shouldUpdateNutritionPlan =
      activityLevel !== undefined ||
      userData.age !== undefined ||
      userData.weight !== undefined ||
      userData.height !== undefined ||
      userData.sex !== undefined ||
      goal !== undefined;

    const savedUser = await this.userRepository.save(user);

    if (shouldUpdateNutritionPlan) {
      activityLevelValue =
        activityLevelValue ??
        (await this.findActivityLevelValueById(savedUser.activityLevelId));

      const nutritionPlan =
        await this.nutritionPlanService.createOrUpdateForUser(
          savedUser,
          activityLevelValue,
          goal,
        );

      return Object.assign(savedUser, { nutritionPlan });
    }

    return savedUser;
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);

    return this.userRepository.remove(user);
  }

  async updateThemeColors(
    userId: number,
    updateUserThemeColorsDto: UpdateUserThemeColorsDto,
  ): Promise<Pick<User, 'id' | 'primaryColor' | 'secondaryColor'>> {
    const user = await this.findOne(userId);

    user.primaryColor = this.normalizeHexColor(
      updateUserThemeColorsDto.primaryColor,
      'primaryColor',
    );
    user.secondaryColor = this.normalizeHexColor(
      updateUserThemeColorsDto.secondaryColor,
      'secondaryColor',
    );

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      primaryColor: savedUser.primaryColor,
      secondaryColor: savedUser.secondaryColor,
    };
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async validateEmail(email: string): Promise<{ message: string }> {
    if (!email?.trim()) {
      throw new BadRequestException('El correo electronico es requerido');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: email.trim() },
    });

    if (existingUser) {
      throw new BadRequestException('El correo electronico ya esta registrado');
    }

    return {
      message: 'Correo electronico disponible',
    };
  }

  private async findActivityLevelValueById(
    activityLevelId: number,
  ): Promise<ActivityLevel['value']> {
    const activityLevel = await this.activityLevelRepository.findOne({
      where: { id: activityLevelId },
    });

    if (!activityLevel) {
      throw new BadRequestException('Nivel de actividad invalido');
    }

    return activityLevel.value;
  }

  private normalizeHexColor(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${fieldName} debe ser un color hexadecimal`,
      );
    }

    const sanitizedValue = value.trim().replace(/^#/, '');

    if (/^[\da-f]{3}$/i.test(sanitizedValue)) {
      const [red, green, blue] = sanitizedValue;

      return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
    }

    if (/^[\da-f]{6}$/i.test(sanitizedValue)) {
      return `#${sanitizedValue}`.toLowerCase();
    }

    throw new BadRequestException(`${fieldName} debe ser un color hexadecimal`);
  }
}