import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLevelService } from './activity-level.service';

@ApiTags('niveles de actividad')
@Controller('activity-levels')
export class ActivityLevelController {
  constructor(private readonly activityLevelService: ActivityLevelService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener opciones de nivel de actividad' })
  @ApiResponse({
    status: 200,
    description: 'Listado de opciones de nivel de actividad',
  })
  findAll() {
    return this.activityLevelService.findAll();
  }
}
