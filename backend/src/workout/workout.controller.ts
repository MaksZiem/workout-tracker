import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('workout')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Utwórz nowy trening', description: 'Zakłada pusty trening (bez ćwiczeń) na wskazany dzień. Ćwiczenia i serie dodaje się osobnymi endpointami.' })
  @ApiResponse({ status: 201, description: 'Trening utworzony', type: Workout })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe (np. zły format daty)' })
  createWorkout(@CurrentUser() user: User, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz treningi użytkownika', description: 'Zwraca listę treningów zalogowanego użytkownika, posortowaną malejąco po dacie. Opcjonalnie filtruje po zakresie dat.' })
  @ApiResponse({ status: 200, description: 'Lista treningów', type: Workout, isArray: true })
  findAllWorkoutsForUser(
    @CurrentUser() user: User,
    @Query() filters: FindWorkoutDto,
  ) {
    return this.workoutService.findAllForUser(user.id, filters);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz szczegóły treningu', description: 'Zwraca trening wraz z listą ćwiczeń i seriami.' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiResponse({ status: 200, description: 'Szczegóły treningu', type: Workout })
  @ApiNotFoundResponse({ description: 'Trening nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  async findOneForUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const workout = await this.workoutService.findOne(user.id, id);
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    return workout;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj trening', description: 'Aktualizuje datę i/lub notatki treningu.' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiResponse({ status: 200, description: 'Zaktualizowany trening', type: Workout })
  @ApiNotFoundResponse({ description: 'Trening nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Usuń trening', description: 'Usuwa trening wraz ze wszystkimi jego ćwiczeniami i seriami (kaskadowo).' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiResponse({ status: 200, description: 'Trening usunięty', type: Workout })
  @ApiNotFoundResponse({ description: 'Trening nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.workoutService.remove(user.id, id);
  }

  @Post('/:id/duplicate')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zduplikuj trening',
    description: 'Tworzy kopię treningu (z dzisiejszą datą) wraz z tymi samymi ćwiczeniami i seriami, ale z resetem statusu "completed" na false.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'Identyfikator treningu do zduplikowania' })
  @ApiResponse({ status: 201, description: 'Nowy trening (kopia)', type: Workout })
  @ApiNotFoundResponse({ description: 'Trening źródłowy nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  duplicateWorkout(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutService.duplicateWorkout(user.id, id);
  }

  // workout exercise

  @Post('/:workoutId/exercise')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Dodaj ćwiczenie do treningu', description: 'Dołącza ćwiczenie z globalnego katalogu do wskazanego treningu.' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiResponse({ status: 201, description: 'Ćwiczenie dodane do treningu', type: WorkoutExercise })
  @ApiNotFoundResponse({ description: 'Trening lub ćwiczenie nie istnieje', type: NotFoundErrorDto })
  addExercise(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Body() dto: AddExerciseToWorkoutDto,
  ) {
    return this.workoutService.addExercise(user.id, workoutId, dto);
  }

  @Patch('/:workoutId/exercise/:weId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj ćwiczenie w treningu', description: 'Pozwala zmienić kolejność ćwiczenia w ramach treningu.' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiParam({ name: 'weId', type: Number, example: 5, description: 'Identyfikator wpisu ćwiczenia w treningu (workout exercise id)' })
  @ApiResponse({ status: 200, description: 'Zaktualizowane ćwiczenie treningowe', type: WorkoutExercise })
  @ApiNotFoundResponse({ description: 'Wpis ćwiczenia nie istnieje w tym treningu', type: NotFoundErrorDto })
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
  @ApiOperation({ summary: 'Usuń ćwiczenie z treningu', description: 'Usuwa ćwiczenie wraz ze wszystkimi jego seriami (kaskadowo).' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiParam({ name: 'weId', type: Number, example: 5, description: 'Identyfikator wpisu ćwiczenia w treningu' })
  @ApiResponse({ status: 200, description: 'Ćwiczenie usunięte z treningu', type: WorkoutExercise })
  @ApiNotFoundResponse({ description: 'Wpis ćwiczenia nie istnieje w tym treningu', type: NotFoundErrorDto })
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
  @ApiOperation({ summary: 'Dodaj serię do ćwiczenia', description: 'Rejestruje wykonaną (lub zaplanowaną) serię dla danego ćwiczenia w treningu.' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiParam({ name: 'weId', type: Number, example: 5, description: 'Identyfikator wpisu ćwiczenia w treningu' })
  @ApiResponse({ status: 201, description: 'Seria dodana', type: ExerciseSet })
  @ApiNotFoundResponse({ description: 'Wpis ćwiczenia nie istnieje w tym treningu', type: NotFoundErrorDto })
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
  @ApiOperation({ summary: 'Zaktualizuj serię', description: 'Aktualizuje dowolne pole serii (ciężar, powtórzenia, status ukończenia itd.).' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiParam({ name: 'weId', type: Number, example: 5, description: 'Identyfikator wpisu ćwiczenia w treningu' })
  @ApiParam({ name: 'setId', type: Number, example: 12, description: 'Identyfikator serii' })
  @ApiResponse({ status: 200, description: 'Zaktualizowana seria', type: ExerciseSet })
  @ApiNotFoundResponse({ description: 'Seria nie istnieje w tym ćwiczeniu/treningu', type: NotFoundErrorDto })
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
  @ApiOperation({ summary: 'Usuń serię', description: 'Usuwa pojedynczą serię z ćwiczenia.' })
  @ApiParam({ name: 'workoutId', type: Number, example: 1, description: 'Identyfikator treningu' })
  @ApiParam({ name: 'weId', type: Number, example: 5, description: 'Identyfikator wpisu ćwiczenia w treningu' })
  @ApiParam({ name: 'setId', type: Number, example: 12, description: 'Identyfikator serii' })
  @ApiResponse({ status: 200, description: 'Seria usunięta', type: ExerciseSet })
  @ApiNotFoundResponse({ description: 'Seria nie istnieje w tym ćwiczeniu/treningu', type: NotFoundErrorDto })
  removeSet(
    @CurrentUser() user: User,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('weId', ParseIntPipe) weId: number,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.workoutService.removeSet(user.id, workoutId, weId, setId);
  }
}
