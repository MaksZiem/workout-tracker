import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ExerciseModule } from './exercise/exercise.module';
import { WorkoutModule } from './workout/workout.module';
import { StatsModule } from './stats/stats.module';
import { TemplateModule } from './template/template.module';
import { PlannerModule } from './planner/planner.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { createDataSourceOptions } from './database/database.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...createDataSourceOptions((key) => config.get<string>(key)),
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    ExerciseModule,
    WorkoutModule,
    StatsModule,
    TemplateModule,
    PlannerModule,
    AiModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: createValidationPipe(),
    },
  ],
})
export class AppModule {}
