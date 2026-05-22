import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLevelService } from './activity-level.service';

@ApiTags('activity-levels')
@Controller('activity-levels')
export class ActivityLevelController {
  constructor(private readonly activityLevelService: ActivityLevelService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity level options' })
  @ApiResponse({ status: 200, description: 'List of activity level options' })
  findAll() {
    return this.activityLevelService.findAll();
  }
}
