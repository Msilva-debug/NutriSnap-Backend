import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLevelValue } from '../activity-level/entities/activity-level.entity';
import { hashPassword } from '../auth/password.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

type PublicUser = Omit<User, 'password'>;
type UserProfileInput = Pick<
  CreateUserDto,
  'birthdate' | 'age' | 'weight' | 'height' | 'sex' | 'activityLevel'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    this.validateRequiredUserFields(createUserDto);
    this.validatePassword(createUserDto.password);
    this.validatePasswordConfirmation(
      createUserDto.password,
      createUserDto.confirmPassword,
    );
    this.validateProfile(createUserDto);

    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.usersRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      password: hashPassword(createUserDto.password),
      birthdate: createUserDto.birthdate,
      age: Number(createUserDto.age),
      weight: Number(createUserDto.weight),
      height: Number(createUserDto.height),
      sex: createUserDto.sex,
      activityLevel: createUserDto.activityLevel,
    });
    const savedUser = await this.usersRepository.save(user);

    return this.toPublicUser(savedUser);
  }

  // findAll() {
  //   return `This action returns all users`;
  // }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return this.toPublicUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (updateUserDto.email) {
      this.validateEmail(updateUserDto.email);

      const existingUser = await this.findByEmail(updateUserDto.email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email is already registered');
      }
    }

    this.validateProfile(updateUserDto);

    if (updateUserDto.password || updateUserDto.confirmPassword) {
      this.validatePassword(updateUserDto.password);
      this.validatePasswordConfirmation(
        updateUserDto.password,
        updateUserDto.confirmPassword,
      );
    }

    const updatedUser = {
      ...user,
      email: updateUserDto.email ?? user.email,
      name: updateUserDto.name ?? user.name,
      birthdate: updateUserDto.birthdate ?? user.birthdate,
      age: updateUserDto.age ? Number(updateUserDto.age) : user.age,
      weight: updateUserDto.weight ? Number(updateUserDto.weight) : user.weight,
      height: updateUserDto.height ? Number(updateUserDto.height) : user.height,
      sex: updateUserDto.sex ?? user.sex,
      activityLevel: updateUserDto.activityLevel ?? user.activityLevel,
      password: updateUserDto.password
        ? hashPassword(updateUserDto.password)
        : user.password,
    };
    const savedUser = await this.usersRepository.save(updatedUser);

    return this.toPublicUser(savedUser);
  }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }

  private toPublicUser(user: User): PublicUser {
    const publicUser: Partial<User> = { ...user };
    delete publicUser.password;

    return publicUser as PublicUser;
  }

  private validateRequiredUserFields(createUserDto: CreateUserDto): void {
    const requiredFields: Array<keyof CreateUserDto> = [
      'email',
      'password',
      'confirmPassword',
      'name',
      'birthdate',
      'age',
      'weight',
      'height',
      'sex',
      'activityLevel',
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        createUserDto[field] === undefined ||
        createUserDto[field] === null ||
        createUserDto[field] === '',
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }

    this.validateEmail(createUserDto.email);
  }

  private validateEmail(email: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email must be valid');
    }
  }

  private validatePassword(password?: string): void {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must have at least 6 characters');
    }
  }

  private validatePasswordConfirmation(
    password?: string,
    confirmPassword?: string,
  ): void {
    if (!confirmPassword || password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
  }

  private validateProfile(userDto: Partial<UserProfileInput>): void {
    this.validateRequiredString(userDto.birthdate, 'Birthdate');
    this.validateNumberRange(userDto.age, 'Age', 1, 120);
    this.validateNumberRange(userDto.weight, 'Weight', 20, 300);
    this.validateNumberRange(userDto.height, 'Height', 50, 250);
    this.validateRequiredString(userDto.sex, 'Sex');
    this.validateRequiredString(userDto.activityLevel, 'Activity level');
    this.validateActivityLevel(userDto.activityLevel);
  }

  private validateRequiredString(
    value: string | null | undefined,
    label: string,
  ): void {
    if (value === undefined) {
      return;
    }

    if (value === null || value.trim() === '') {
      throw new BadRequestException(`${label} is required`);
    }
  }

  private validateNumberRange(
    value: number | undefined,
    label: string,
    min: number,
    max: number,
  ): void {
    if (value === undefined) {
      return;
    }

    const numericValue = Number(value);

    if (
      Number.isNaN(numericValue) ||
      numericValue < min ||
      numericValue > max
    ) {
      throw new BadRequestException(
        `${label} must be between ${min} and ${max}`,
      );
    }
  }

  private validateActivityLevel(
    activityLevel: ActivityLevelValue | undefined,
  ): void {
    if (
      activityLevel !== undefined &&
      !Object.values(ActivityLevelValue).includes(activityLevel)
    ) {
      throw new BadRequestException('Activity level is invalid');
    }
  }
}
