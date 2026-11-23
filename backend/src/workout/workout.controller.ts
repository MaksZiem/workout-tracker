import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { errorBody } from 'src/common/error-body';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ConflictErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
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
import { Workout } from './workout.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { ExerciseSet } from './exercise-set.entity';

@ApiTags('workout')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Utwórz nowy trening',
    description:
      'Zakłada pusty trening (bez ćwiczeń) na wskazany dzień. Ćwiczenia i serie dodaje się osobnymi endpointami.',
  })
  @ApiCreatedResponse({ description: 'Trening utworzony', type: Workout })
  @ApiBadRequestResponse({
    description: 'Nieprawidłowe dane wejściowe (np. zły format daty)',
    type: BadRequestErrorDto,
  })
  createWorkout(@CurrentUser() user: User, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Pobierz treningi użytkownika',
    description:
      'Zwraca listę treningów zalogowanego użytkownika, posortowaną malejąco po dacie. Opcjonalnie filtruje po zakresie dat.',
  })
  @ApiOkResponse({
    description: 'Lista treningów',
    type: Workout,
    isArray: true,
  })
  findAllWorkoutsForUser(
    @CurrentUser() user: User,
    @Query() filters: FindWorkoutDto,
  ) {
    return this.workoutService.findAllForUser(user.id, filters);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Pobierz szczegóły treningu',
    description: 'Zwraca trening wraz z listą ćwiczeń i seriami.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiOkResponse({ description: 'Szczegóły treningu', type: Workout })
  @ApiNotFoundResponse({
    description:
      'Trening nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  async findOneForUser(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
  ) {
    const workout = await this.workoutService.findOne(user.id, id);
    if (!workout) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'WORKOUT_NOT_FOUND',
          'Workout not found',
        ),
      );
    }
    return workout;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj trening',
    description: 'Aktualizuje datę i/lub notatki treningu.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiOkResponse({ description: 'Zaktualizowany trening', type: Workout })
  @ApiNotFoundResponse({
    description:
      'Trening nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Usuń trening',
    description:
      'Usuwa trening wraz ze wszystkimi jego ćwiczeniami i seriami (kaskadowo). Jeśli trening pochodził z planera, wpis wraca do statusu PLANNED.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiOkResponse({ description: 'Trening usunięty', type: Workout })
  @ApiNotFoundResponse({
    description:
      'Trening nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  remove(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.workoutService.remove(user.id, id);
  }

  @Post('/:id/duplicate')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zduplikuj trening',
    description:
      'Tworzy kopię treningu (z dzisiejszą datą) wraz z tymi samymi ćwiczeniami i seriami, ale z resetem statusu "completed" na false.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu do zduplikowania',
  })
  @ApiCreatedResponse({ description: 'Nowy trening (kopia)', type: Workout })
  @ApiNotFoundResponse({
    description:
      'Trening źródłowy nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  duplicateWorkout(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
  ) {
    return this.workoutService.duplicateWorkout(user.id, id);
  }

  @Post('/:id/finish')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zakończ trening',
    description:
      'Ustawia finishedAt (jeśli jeszcze nie ustawione) i oznacza powiązany zaplanowany trening jako COMPLETED. Operacja idempotentna.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiCreatedResponse({ description: 'Zakończony trening', type: Workout })
  @ApiNotFoundResponse({
    description:
      'Trening nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  finish(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.workoutService.finish(user.id, id);
  }

  @Post('/:id/cancel')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Przerwij trening',
    description:
      'Przerywa trening w trakcie: usuwa go wraz z ćwiczeniami i seriami, a powiązany zaplanowany trening wraca do statusu PLANNED, więc można go rozpocząć od nowa. Zakończonego treningu nie można przerwać (409).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiCreatedResponse({
    description: 'Trening przerwany',
    schema: { example: { cancelled: true } },
  })
  @ApiNotFoundResponse({
    description:
      'Trening nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  @ApiConflictResponse({
    description: 'Trening jest już zakończony',
    type: ConflictErrorDto,
  })
  cancel(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.workoutService.cancel(user.id, id);
  }

  @Post('/:workoutId/exercise')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Dodaj ćwiczenie do treningu',
    description:
      'Dołącza ćwiczenie z globalnego katalogu do wskazanego treningu.',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiCreatedResponse({
    description: 'Ćwiczenie dodane do treningu',
    type: WorkoutExercise,
  })
  @ApiNotFoundResponse({
    description: 'Trening lub ćwiczenie nie istnieje',
    type: NotFoundErrorDto,
  })
  addExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Body() dto: AddExerciseToWorkoutDto,
  ) {
    return this.workoutService.addExercise(user.id, workoutId, dto);
  }

  @Patch('/:workoutId/exercise/:weId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj ćwiczenie w treningu',
    description: 'Pozwala zmienić kolejność ćwiczenia w ramach treningu.',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiParam({
    name: 'weId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description:
      'Identyfikator wpisu ćwiczenia w treningu (workout exercise id)',
  })
  @ApiOkResponse({
    description: 'Zaktualizowane ćwiczenie treningowe',
    type: WorkoutExercise,
  })
  @ApiNotFoundResponse({
    description: 'Wpis ćwiczenia nie istnieje w tym treningu',
    type: NotFoundErrorDto,
  })
  updateExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Param('weId', ParseIdPipe) weId: string,
    @Body() dto: UpdateWorkoutExerciseDto,
  ) {
    return this.workoutService.updateExercise(user.id, workoutId, weId, dto);
  }

  @Delete('/:workoutId/exercise/:weId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Usuń ćwiczenie z treningu',
    description: 'Usuwa ćwiczenie wraz ze wszystkimi jego seriami (kaskadowo).',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiParam({
    name: 'weId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator wpisu ćwiczenia w treningu',
  })
  @ApiOkResponse({
    description: 'Ćwiczenie usunięte z treningu',
    type: WorkoutExercise,
  })
  @ApiNotFoundResponse({
    description: 'Wpis ćwiczenia nie istnieje w tym treningu',
    type: NotFoundErrorDto,
  })
  removeExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Param('weId', ParseIdPipe) weId: string,
  ) {
    return this.workoutService.removeExercise(user.id, workoutId, weId);
  }

  @Post('/:workoutId/exercise/:weId/set')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Dodaj serię do ćwiczenia',
    description:
      'Rejestruje wykonaną (lub zaplanowaną) serię dla danego ćwiczenia w treningu.',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiParam({
    name: 'weId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator wpisu ćwiczenia w treningu',
  })
  @ApiCreatedResponse({ description: 'Seria dodana', type: ExerciseSet })
  @ApiNotFoundResponse({
    description: 'Wpis ćwiczenia nie istnieje w tym treningu',
    type: NotFoundErrorDto,
  })
  addSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Param('weId', ParseIdPipe) weId: string,
    @Body() dto: AddSetDto,
  ) {
    return this.workoutService.addSet(user.id, workoutId, weId, dto);
  }

  @Patch('/:workoutId/exercise/:weId/set/:setId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj serię',
    description:
      'Aktualizuje dowolne pole serii (ciężar, powtórzenia, status ukończenia itd.).',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiParam({
    name: 'weId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator wpisu ćwiczenia w treningu',
  })
  @ApiParam({
    name: 'setId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator serii',
  })
  @ApiOkResponse({ description: 'Zaktualizowana seria', type: ExerciseSet })
  @ApiNotFoundResponse({
    description: 'Seria nie istnieje w tym ćwiczeniu/treningu',
    type: NotFoundErrorDto,
  })
  updateSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Param('weId', ParseIdPipe) weId: string,
    @Param('setId', ParseIdPipe) setId: string,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutService.updateSet(user.id, workoutId, weId, setId, dto);
  }

  @Delete('/:workoutId/exercise/:weId/set/:setId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Usuń serię',
    description: 'Usuwa pojedynczą serię z ćwiczenia.',
  })
  @ApiParam({
    name: 'workoutId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator treningu',
  })
  @ApiParam({
    name: 'weId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator wpisu ćwiczenia w treningu',
  })
  @ApiParam({
    name: 'setId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator serii',
  })
  @ApiOkResponse({ description: 'Seria usunięta', type: ExerciseSet })
  @ApiNotFoundResponse({
    description: 'Seria nie istnieje w tym ćwiczeniu/treningu',
    type: NotFoundErrorDto,
  })
  removeSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIdPipe) workoutId: string,
    @Param('weId', ParseIdPipe) weId: string,
    @Param('setId', ParseIdPipe) setId: string,
  ) {
    return this.workoutService.removeSet(user.id, workoutId, weId, setId);
  }
}
