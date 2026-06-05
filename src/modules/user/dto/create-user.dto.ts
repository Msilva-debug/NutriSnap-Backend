import { ApiProperty } from '@nestjs/swagger';
import { ActivityLevelValue } from '../../activity-level/entities/activity-level.entity';
import { UserGoal } from '../../nutrition-plan/entities/nutrition-plan.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Correo electronico del usuario',
  })
  email: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  name: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contrasena del usuario',
  })
  password: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Confirmacion de la contrasena del usuario',
  })
  confirmPassword: string;

  @ApiProperty({
    example: '1998-05-22',
    description: 'Fecha de nacimiento del usuario',
  })
  birthdate: string;

  @ApiProperty({
    example: 26,
    description: 'Edad del usuario',
  })
  age: number;

  @ApiProperty({
    example: 70,
    description: 'Peso del usuario en kilogramos',
  })
  weight: number;

  @ApiProperty({
    example: 175,
    description: 'Altura del usuario en centimetros',
  })
  height: number;

  @ApiProperty({
    example: 'masculino',
    description: 'Sexo del usuario',
  })
  sex: string;

  @ApiProperty({
    enum: UserGoal,
    example: UserGoal.LOSE_FAT,
    description: 'Meta principal del usuario',
  })
  goal: UserGoal;

  @ApiProperty({
    enum: ActivityLevelValue,
    example: ActivityLevelValue.MODERATE,
    description: 'Nivel de actividad del usuario',
  })
  activityLevel: ActivityLevelValue;
}
