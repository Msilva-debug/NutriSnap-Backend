import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityLevel,
  ActivityLevelValue,
} from '../activity-level/entities/activity-level.entity';
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
    @InjectRepository(ActivityLevel)
    private readonly activityLevelRepository: Repository<ActivityLevel>,
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
    const activityLevel = await this.findActivityLevelByValue(
      createUserDto.activityLevel,
    );

    if (existingUser) {
      throw new ConflictException('El correo ya esta registrado');
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
      activityLevelId: activityLevel.id,
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
      throw new NotFoundException(`Usuario #${id} no encontrado`);
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
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }

    if (updateUserDto.email) {
      this.validateEmail(updateUserDto.email);

      const existingUser = await this.findByEmail(updateUserDto.email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El correo ya esta registrado');
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

    const activityLevel = updateUserDto.activityLevel
      ? await this.findActivityLevelByValue(updateUserDto.activityLevel)
      : undefined;

    const updatedUser = {
      ...user,
      email: updateUserDto.email ?? user.email,
      name: updateUserDto.name ?? user.name,
      birthdate: updateUserDto.birthdate ?? user.birthdate,
      age: updateUserDto.age ? Number(updateUserDto.age) : user.age,
      weight: updateUserDto.weight ? Number(updateUserDto.weight) : user.weight,
      height: updateUserDto.height ? Number(updateUserDto.height) : user.height,
      sex: updateUserDto.sex ?? user.sex,
      activityLevelId: activityLevel?.id ?? user.activityLevelId,
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
        `Faltan campos obligatorios: ${missingFields.join(', ')}`,
      );
    }

    this.validateEmail(createUserDto.email);
  }

  private validateEmail(email: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('El correo debe ser valido');
    }
  }

  private validatePassword(password?: string): void {
    if (!password || password.length < 6) {
      throw new BadRequestException(
        'La contrasena debe tener al menos 6 caracteres',
      );
    }
  }

  private validatePasswordConfirmation(
    password?: string,
    confirmPassword?: string,
  ): void {
    if (!confirmPassword || password !== confirmPassword) {
      throw new BadRequestException('Las contrasenas no coinciden');
    }
  }

  private validateProfile(userDto: Partial<UserProfileInput>): void {
    this.validateRequiredString(userDto.birthdate, 'La fecha de nacimiento');
    this.validateNumberRange(userDto.age, 'La edad', 1, 120);
    this.validateNumberRange(userDto.weight, 'El peso', 20, 300);
    this.validateNumberRange(userDto.height, 'La altura', 50, 250);
    this.validateRequiredString(userDto.sex, 'El sexo');
    this.validateRequiredString(userDto.activityLevel, 'El nivel de actividad');
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
      throw new BadRequestException(`${label} es obligatorio`);
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
        `${label} debe estar entre ${min} y ${max}`,
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
      throw new BadRequestException('El nivel de actividad es invalido');
    }
  }

  private async findActivityLevelByValue(
    activityLevel: ActivityLevelValue,
  ): Promise<ActivityLevel> {
    const existingActivityLevel = await this.activityLevelRepository.findOne({
      where: {
        value: activityLevel,
      },
    });

    if (!existingActivityLevel) {
      throw new BadRequestException('El nivel de actividad no existe');
    }

    return existingActivityLevel;
  }
}
