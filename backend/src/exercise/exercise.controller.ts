import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { AdminGuard } from 'src/guards/admin.guard';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query('muscleGroup') muscleGroup?: MuscleGroup) {
    return this.exerciseService.findAll(muscleGroup);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findOne(id)
  }

  @Post()
  @UseGuards(AdminGuard)
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto)
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  updateExercise(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  removeExercise(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.remove(id)
  }
}
