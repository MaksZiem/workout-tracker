import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { AdminGuard } from 'src/guards/admin.guard';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';
import { Exercise } from './exercise.entity';
import { ExerciseSubstituteDto, GenerateAllSubstitutesResultDto } from './dtos/exercise-substitute.dto';
import { ErrorResponseDto, ForbiddenErrorDto, NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('exercise')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz katalog ćwiczeń', description: 'Zwraca wszystkie ćwiczenia dostępne w systemie, opcjonalnie przefiltrowane po grupie mięśniowej.' })
  @ApiQuery({ name: 'muscleGroup', enum: MuscleGroup, required: false, description: 'Filtruj po grupie mięśniowej' })
  @ApiResponse({ status: 200, description: 'Lista ćwiczeń', type: Exercise, isArray: true })
  findAll(@Query('muscleGroup') muscleGroup?: MuscleGroup) {
    return this.exerciseService.findAll(muscleGroup);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz ćwiczenie po id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Znalezione ćwiczenie', type: Exercise })
  @ApiNotFoundResponse({ description: 'Ćwiczenie o podanym id nie istnieje', type: NotFoundErrorDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const exercise = await this.exerciseService.findOne(id)
    if (!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    return exercise
  }

  @Get('/:id/substitutes')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zamienniki ćwiczenia',
    description:
      'Do 5 ćwiczeń z katalogu, które AI (Gemini) uznało za dobre zamienniki: ten sam wzorzec ruchu i te same główne mięśnie. Każdy z krótkim uzasadnieniem, od najlepszego. Pusta lista: AI nie znalazło zamiennika albo jeszcze nie dobierało (patrz `substitutesGeneratedAt`).',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Zamienniki od najlepszego', type: ExerciseSubstituteDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  findSubstitutes(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findSubstitutes(id)
  }

  @Post('/substitutes/generate')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Dobierz zamienniki dla katalogu (tylko administrator)',
    description:
      'Po kolei prosi AI o zamienniki dla ćwiczeń, które ich jeszcze nie mają, a z `all=true` dla wszystkich (np. po dodaniu nowych ćwiczeń, które mogą być zamiennikami starych). Błąd jednego ćwiczenia nie przerywa pozostałych.',
  })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'true: dobierz od nowa dla całego katalogu' })
  @ApiResponse({ status: 201, description: 'Podsumowanie', type: GenerateAllSubstitutesResultDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  generateAllSubstitutes(@Query('all') all?: string) {
    return this.exerciseService.generateAllSubstitutes(all !== 'true')
  }

  @Post('/:id/substitutes/generate')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Dobierz zamienniki ćwiczenia od nowa (tylko administrator)',
    description: 'AI wybiera zamienniki z aktualnego katalogu; wynik zastępuje poprzednią listę.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Nowa lista zamienników', type: ExerciseSubstituteDto, isArray: true })
  @ApiResponse({ status: 502, description: 'AI nie odpowiedziało; poprzednia lista zostaje', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  generateSubstitutes(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.generateSubstitutes(id)
  }

  @Delete('/:id/substitutes/:substituteId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Odrzuć zamiennik (tylko administrator)',
    description: 'Usuwa jeden zamiennik wybrany przez AI, gdy administrator się z nim nie zgadza.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiParam({ name: 'substituteId', type: Number, example: 6 })
  @ApiResponse({ status: 200, description: 'Pozostałe zamienniki', type: ExerciseSubstituteDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Nie ma takiego zamiennika', type: NotFoundErrorDto })
  removeSubstitute(
    @Param('id', ParseIntPipe) id: number,
    @Param('substituteId', ParseIntPipe) substituteId: number,
  ) {
    return this.exerciseService.removeSubstitute(id, substituteId)
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Dodaj nowe ćwiczenie (tylko administrator)',
    description: 'Tworzy nowe ćwiczenie w globalnym katalogu i od razu prosi AI (Gemini) o jego zamienniki.',
  })
  @ApiResponse({ status: 201, description: 'Ćwiczenie utworzone. Gdy Gemini nie odpowie, ćwiczenie zapisuje się bez zamienników (substitutesGeneratedAt: null) - można je dobrać później.', type: Exercise })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe' })
  @ApiConflictResponse({ description: 'Ćwiczenie o tej nazwie już istnieje (bez względu na wielkość liter)', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto)
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Zaktualizuj ćwiczenie (tylko administrator)',
    description: 'Aktualizuje nazwę i/lub grupę mięśniową. Jeśli zmieniono nazwę lub grupę, AI dobiera zamienniki od nowa (przy błędzie Gemini substitutesGeneratedAt zostaje null).',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Zaktualizowane ćwiczenie', type: Exercise })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  @ApiConflictResponse({ description: 'Inne ćwiczenie ma już tę nazwę', type: ErrorResponseDto })
  updateExercise(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto)
  }

  @Get('/:id/usage')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Sprawdź, gdzie ćwiczenie jest używane (tylko administrator)',
    description: 'Liczba treningów i szablonów zawierających ćwiczenie. Usunąć można tylko ćwiczenie nieużywane.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Liczniki użycia', schema: { example: { workoutCount: 12, templateCount: 2 } } })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  usage(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.usage(id)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Usuń ćwiczenie (tylko administrator)',
    description: 'Usuwa ćwiczenie z katalogu. Ćwiczenia użytego w treningu lub szablonie nie da się usunąć (409), żeby nie skasować historii - zmień wtedy jego nazwę.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Ćwiczenie usunięte', type: Exercise })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  @ApiConflictResponse({ description: 'Ćwiczenie jest używane w treningach lub szablonach', type: ErrorResponseDto })
  removeExercise(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.remove(id)
  }
}
