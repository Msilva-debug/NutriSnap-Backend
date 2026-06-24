import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealModule } from './modules/meal/meal.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityLevelModule } from './modules/activity-level/activity-level.module';
import { NutritionPlanModule } from './modules/nutrition-plan/nutrition-plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      password: 'admin',
      username: 'postgres',
      database: 'nutrisnap',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: false,
      dropSchema: false,
    }),
    UsersModule,
    AuthModule,
    MealModule,
    ActivityLevelModule,
    NutritionPlanModule,
  ],
})
export class AppModule {}
