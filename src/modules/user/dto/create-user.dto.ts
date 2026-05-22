import { ApiProperty } from '@nestjs/swagger';
import { ActivityLevelValue } from '../../activity-level/entities/activity-level.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    example: 'Password123',
    description: 'User password',
  })
  password: string;

  @ApiProperty({
    example: 'Password123',
    description: 'User password confirmation',
  })
  confirmPassword: string;

  @ApiProperty({
    example: '1998-05-22',
    description: 'User birthdate',
  })
  birthdate: string;

  @ApiProperty({
    example: 26,
    description: 'User age',
  })
  age: number;

  @ApiProperty({
    example: 70,
    description: 'User weight in kilograms',
  })
  weight: number;

  @ApiProperty({
    example: 175,
    description: 'User height in centimeters',
  })
  height: number;

  @ApiProperty({
    example: 'male',
    description: 'User sex',
  })
  sex: string;

  @ApiProperty({
    enum: ActivityLevelValue,
    example: ActivityLevelValue.MODERATE,
    description: 'User activity level',
  })
  activityLevel: ActivityLevelValue;
}
