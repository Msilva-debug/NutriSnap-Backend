import { PartialType } from '@nestjs/mapped-types';
import { CreateMealDto } from './create-meal.dto';

export class UpdateMealDto extends PartialType(CreateMealDto) {
  // All fields from CreateMealDto are optional for updates
}
