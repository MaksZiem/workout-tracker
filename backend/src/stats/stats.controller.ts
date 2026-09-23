import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { ExerciseProgressFilterDto } from './dtos/exercise-progress-filter.dto';
import { NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('stats')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('/exercise/:exerciseId/progress')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Postęp w danym ćwiczeniu w czasie',
    description: 'Zwraca chronologiczną listę punktów postępu (ciężar, objętość, szacowany 1RM) dla wskazanego ćwiczenia, opcjonalnie w zadanym zakresie dat.',
  })
  @ApiParam({ name: 'exerciseId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Lista punktów postępu, jeden na trening zawierający dane ćwiczenie',
    schema: {
      example: [
        {
          date: '2026-08-01',
          sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }],
          topWeight: 80,
          volume: 1200,
          estimatedOneRepMax: 101.3,
        },
        {
          date: '2026-08-08',
          sets: [{ weight: 82.5, reps: 8 }],
          topWeight: 82.5,
          volume: 660,
          estimatedOneRepMax: 104.5,
        },
      ],
    },
  })
  getExerciseProgress(
    @CurrentUser() user: User,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getExerciseProgress(user.id, exerciseId, filters.from, filters.to)
  }

  @Get('/exercise/:exerciseId/records')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Rekordy życiowe dla danego ćwiczenia',
    description: 'Zwraca najlepszy ciężar, najlepszą objętość w pojedynczej serii oraz najlepszy szacowany ciężar maksymalny (1RM) dla wskazanego ćwiczenia, liczone na podstawie ukończonych serii.',
  })
  @ApiParam({ name: 'exerciseId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Rekordy życiowe dla ćwiczenia',
    schema: {
      example: {
        maxWeight: 100,
        maxWeightDate: '2026-09-01',
        maxWeightExercise: 'Wyciskanie sztangi leżąc',
        bestVolumeInSingleSet: 800,
        bestVolumeDate: '2026-08-20',
        bestEstimatedOneRepMax: 112.5,
        bestEstimatedOneRepMaxDate: '2026-09-01',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Brak ukończonych serii dla tego ćwiczenia', type: NotFoundErrorDto })
  getPersonalRecords(
    @CurrentUser() user: User,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.statsService.getPersonalRecords(user.id, exerciseId)
  }

  @Get('/records')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Rekordy życiowe dla wszystkich ćwiczeń', description: 'Zwraca rekordy życiowe (jak wyżej) dla każdego ćwiczenia, w którym użytkownik ma choć jedną ukończoną serię.' })
  @ApiResponse({
    status: 200,
    description: 'Lista rekordów życiowych pogrupowanych po ćwiczeniu',
    schema: {
      example: [
        {
          exerciseId: 1,
          exerciseName: 'Wyciskanie sztangi leżąc',
          maxWeight: 100,
          maxWeightDate: '2026-09-01',
          maxWeightExercise: 'Wyciskanie sztangi leżąc',
          bestVolumeInSingleSet: 800,
          bestVolumeDate: '2026-08-20',
          bestEstimatedOneRepMax: 112.5,
          bestEstimatedOneRepMaxDate: '2026-09-01',
        },
      ],
    },
  })
  getAllPersonalRecords(@CurrentUser() user: User) {
    return this.statsService.getAllPersonalRecords(user.id)
  }

  @Get('/muscle-groups')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Rozkład objętości treningowej wg grup mięśniowych', description: 'Zwraca liczbę ukończonych serii i całkowitą objętość (ciężar x powtórzenia) dla każdej trenowanej grupy mięśniowej, opcjonalnie w zadanym zakresie dat.' })
  @ApiResponse({
    status: 200,
    description: 'Rozkład serii/objętości wg grupy mięśniowej',
    schema: {
      example: [
        { muscleGroup: 'CHEST', sets: 24, volume: 5400 },
        { muscleGroup: 'BACK', sets: 18, volume: 4200 },
      ],
    },
  })
  getMuscleGroupDistribution(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getMuscleGroupDistribution(user.id, filters.from, filters.to)
  }

  @Get('/frequency')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Częstotliwość treningów (heatmapa)',
    description: 'Zwraca gęstą listę dni (bez dziur) z liczbą treningów w danym dniu - gotową pod heatmapę w stylu GitHub contributions. Domyślnie ostatnie 365 dni.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista dni z liczbą treningów',
    schema: {
      example: [
        { date: '2026-09-21', count: 1 },
        { date: '2026-09-22', count: 0 },
        { date: '2026-09-23', count: 1 },
      ],
    },
  })
  getWorkoutFrequency(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getWorkoutFrequency(user.id, filters.from, filters.to)
  }

  @Get('/streak')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Aktualna passa treningowa', description: 'Zwraca liczbę kolejnych dni (licząc wstecz od dziś lub wczoraj) z co najmniej jednym treningiem.' })
  @ApiResponse({ status: 200, description: 'Liczba dni passy treningowej', schema: { type: 'number', example: 5 } })
  getCurrentStreak(@CurrentUser() user: User) {
    return this.statsService.getCurrentStreak(user.id)
  }

  @Get('/summary')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Podsumowanie aktywności użytkownika', description: 'Zwraca zbiorcze statystyki: liczbę treningów, serii, łączną objętość, średnią liczbę serii na trening, najczęściej trenowaną grupę mięśniową i aktualną passę.' })
  @ApiResponse({
    status: 200,
    description: 'Podsumowanie statystyk',
    schema: {
      example: {
        totalWorkouts: 42,
        totalSets: 380,
        totalVolume: 95400,
        avgSetsPerWorkout: 9.05,
        mostTrainedMuscleGroup: 'CHEST',
        currentStreak: 5,
      },
    },
  })
  getSummary(
    @CurrentUser() user: User,
    @Query() filters: ExerciseProgressFilterDto,
  ) {
    return this.statsService.getSummary(user.id, filters.from, filters.to)
  }
}
