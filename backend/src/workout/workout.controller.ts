import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { FindWorkoutDto } from './dtos/find-workout.dto';
import { UpdateWorkoutDto } from './dtos/update-workout.dto';
import { AddExerciseToWorkoutDto } from './dtos/add-exercise-to-workout.dto';
import { UpdateWorkoutExerciseDto } from './dtos/update-workout-exercise.dto';
import { AddSetDto } from './dtos/add-set.dto';
import { UpdateSetDto } from './dtos/update-set.dto';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  @UseGuards(AuthGuard)
  createWorkout(@CurrentUser() user: User, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAllWorkoutsForUser(
    @CurrentUser() user: User,
    @Query() filters: FindWorkoutDto,
  ) {
    return this.workoutService.findAllForUser(user.id, filters);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  findOneForUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutService.findOne(user.id, id);
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.workoutService.remove(user.id, id);
  }

  // workout exercise

  @Post('/:workoutId/exercise')
  @UseGuards(AuthGuard)
  addExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Body() dto: AddExerciseToWorkoutDto,
  ) {
    return this.workoutService.addExercise(user.id, workoutId, dto);
  }

  @Patch('/:workoutId/exercise/:weId')
  @UseGuards(AuthGuard)
  updateExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
    @Body() dto: UpdateWorkoutExerciseDto,
  ) {
    return this.workoutService.updateExercise(user.id, workoutId, weId, dto);
  }

  @Delete('/:workoutId/exercise/:weId')
  @UseGuards(AuthGuard)
  removeExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
  ) {
    return this.workoutService.removeExercise(user.id, workoutId, weId);
  }

  // exercise set

  @Post('/:workoutId/exercise/:weId/set')
  @UseGuards(AuthGuard)
  addSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
    @Body() dto: AddSetDto,
  ) {
    return this.workoutService.addSet(user.id, workoutId, weId, dto);
  }

  @Patch('/:workoutId/exercise/:weId/set/:setId')
  @UseGuards(AuthGuard)
  updateSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutService.updateSet(user.id, workoutId, weId, setId, dto);
  }

  @Delete('/:workoutId/exercise/:weId/set/:setId')
  @UseGuards(AuthGuard)
  removeSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.workoutService.removeSet(user.id, workoutId, weId, setId);
  }
}
