import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { ExerciseProgressFilterDto } from './dtos/exercise-progress-filter.dto';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('/exercise/:exerciseId/progress')
  @UseGuards(AuthGuard)
  getExerciseProgress(
    @CurrentUser() user: User,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getExerciseProgress(user.id, exerciseId, filters.from, filters.to)
  }

  @Get('/exercise/:exerciseId/records')
  @UseGuards(AuthGuard)
  getPersonalRecords(
    @CurrentUser() user: User,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.statsService.getPersonalRecords(user.id, exerciseId)
  }

  @Get('/records')
  @UseGuards(AuthGuard)
  getAllPersonalRecords(@CurrentUser() user: User) {
    return this.statsService.getAllPersonalRecords(user.id)
  }

  @Get('/muscle-groups')
  @UseGuards(AuthGuard)
  getMuscleGroupDistribution(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getMuscleGroupDistribution(user.id, filters.from, filters.to)
  }

  @Get('/frequency')
  @UseGuards(AuthGuard)
  getWorkoutFrequency(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getWorkoutFrequency(user.id, filters.from, filters.to)
  }

  @Get('/streak')
  @UseGuards(AuthGuard)
  getCurrentStreak(@CurrentUser() user: User) {
    return this.statsService.getCurrentStreak(user.id)
  }

  @Get('/summary')
  @UseGuards(AuthGuard)
  getSummary(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getSummary(user.id, filters.from, filters.to)
  }
}
