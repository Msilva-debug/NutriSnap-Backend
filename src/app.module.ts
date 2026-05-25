import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealModule } from './modules/meal/meal.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityLevelModule } from './modules/activity-level/activity-level.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      password: 'admin',
      username: 'postgres',
      database: 'nutrisnap',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: false,
      synchronize: false,
      dropSchema: false,
    }),
    UsersModule,
    AuthModule,
    MealModule,
    ActivityLevelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
