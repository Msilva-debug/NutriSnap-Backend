import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLevel } from './entities/activity-level.entity';

@Injectable()
export class ActivityLevelService {
  constructor(
    @InjectRepository(ActivityLevel)
    private readonly activityLevelRepository: Repository<ActivityLevel>,
  ) {}
  findAll(): Promise<ActivityLevel[]> {
    return this.activityLevelRepository.find({
      order: {
        sortOrder: 'ASC',
      },
    });
  }
}
