import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealModule } from './modules/meal/meal.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityLevelModule } from './modules/activity-level/activity-level.module';
import { NutritionPlanModule } from './modules/nutrition-plan/nutrition-plan.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { FoodPreparationModule } from './modules/food-preparation/food-preparation.module';

function getBooleanConfig(
  configService: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = configService.get<string>(key);

  if (value === undefined) {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        password: configService.get<string>('DB_PASSWORD', 'admin'),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'nutrisnap'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: getBooleanConfig(configService, 'DB_MIGRATIONS_RUN', true),
        synchronize: getBooleanConfig(configService, 'DB_SYNCHRONIZE', false),
        dropSchema: getBooleanConfig(configService, 'DB_DROP_SCHEMA', false),
      }),
    }),
    UsersModule,
    AuthModule,
    MealModule,
    FoodPreparationModule,
    RecommendationsModule,
    ActivityLevelModule,
    NutritionPlanModule,
  ],
})
export class AppModule {}
