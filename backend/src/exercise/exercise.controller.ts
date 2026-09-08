import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { MuscleGroup } from 'src/enums/muscle-group.enum';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query('muscleGroup') muscleGroup?: MuscleGroup) {
    return this.exerciseService.findAll(muscleGroup);
  }
}
