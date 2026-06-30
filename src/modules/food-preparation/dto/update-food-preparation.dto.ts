import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodPreparationDto } from './create-food-preparation.dto';

export class UpdateFoodPreparationDto extends PartialType(
  CreateFoodPreparationDto,
) {}
