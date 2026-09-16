import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { ScheduledWorkout } from './scheduled-workout.entity';
import { TemplateModule } from 'src/template/template.module';
import { WorkoutModule } from 'src/workout/workout.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledWorkout]),
    TemplateModule,
    WorkoutModule,
    UsersModule,
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
