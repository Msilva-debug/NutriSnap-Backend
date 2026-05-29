import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLevel } from '../activity-level/entities/activity-level.entity';
import { hashPassword } from '../auth/password.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ActivityLevel)
    private readonly activityLevelRepository: Repository<ActivityLevel>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Las contrasenas no coinciden');
    }

    const activityLevel = await this.activityLevelRepository.findOne({
      where: { value: createUserDto.activityLevel },
    });

    if (!activityLevel?.id) {
      throw new BadRequestException('Nivel de actividad invalido');
    }

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashPassword(createUserDto.password),
      name: createUserDto.name,
      birthdate: createUserDto.birthdate,
      age: Number(createUserDto.age),
      weight: Number(createUserDto.weight),
      height: Number(createUserDto.height),
      sex: createUserDto.sex,
      activityLevelId: activityLevel.id,
    });

    return this.userRepository.save(user);
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
    const { activityLevel, confirmPassword, password, ...userData } =
      updateUserDto;

    Object.assign(user, {
      ...userData,
      age: userData.age !== undefined ? Number(userData.age) : user.age,
      weight:
        userData.weight !== undefined ? Number(userData.weight) : user.weight,
      height:
        userData.height !== undefined ? Number(userData.height) : user.height,
    });

    if (activityLevel !== undefined) {
      const activityLevelOption = await this.activityLevelRepository.findOne({
        where: { value: activityLevel },
      });

      if (!activityLevelOption?.id) {
        throw new BadRequestException('Nivel de actividad invalido');
      }

      user.activityLevelId = activityLevelOption.id;
    }

    if (password !== undefined) {
      if (password !== confirmPassword) {
        throw new BadRequestException('Las contrasenas no coinciden');
      }

      user.password = hashPassword(password);
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);

    return this.userRepository.remove(user);
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
}
