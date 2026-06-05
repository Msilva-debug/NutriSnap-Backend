import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NutritionPlanService } from './nutrition-plan.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('planes nutricionales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('nutrition-plan')
export class NutritionPlanController {
  constructor(private readonly nutritionPlanService: NutritionPlanService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi plan nutricional' })
  @ApiResponse({ status: 200, description: 'Plan nutricional encontrado' })
  @ApiResponse({ status: 404, description: 'Plan nutricional no encontrado' })
  findMine(@Req() request: AuthenticatedRequest) {
    return this.nutritionPlanService.findByUserId(request.user.id);
  }
}
