import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { ForbiddenErrorDto, NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

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

  @Get('/:id/similar')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Znajdź podobne ćwiczenia',
    description:
      'Na podstawie embeddingu semantycznego (wygenerowanego przez Gemini) zwraca do 5 najbardziej podobnych ćwiczeń z tej samej grupy mięśniowej, posortowanych malejąco po podobieństwie kosinusowym. Przydatne np. przy zamianie ćwiczenia z powodu braku sprzętu lub kontuzji.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Lista podobnych ćwiczeń wraz ze współczynnikiem podobieństwa (0-1)',
    schema: {
      example: [
        { exercise: { id: 4, name: 'Wyciskanie hantli leżąc', muscleGroup: 'CHEST' }, similarity: 0.93 },
        { exercise: { id: 7, name: 'Rozpiętki na ławce skośnej', muscleGroup: 'CHEST' }, similarity: 0.81 },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje lub nie ma jeszcze wygenerowanego embeddingu', type: NotFoundErrorDto })
  findSimilar(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findSimilar(id)
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Dodaj nowe ćwiczenie (tylko administrator)',
    description: 'Tworzy nowe ćwiczenie w globalnym katalogu i automatycznie generuje dla niego embedding semantyczny (Gemini).',
  })
  @ApiResponse({ status: 201, description: 'Ćwiczenie utworzone', type: Exercise })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe' })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto)
  }

  @Post('/backfill-embeddings')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Dogeneruj brakujące embeddingi (tylko administrator)',
    description: 'Operacja administracyjna: przelicza embedding semantyczny dla wszystkich ćwiczeń, które go jeszcze nie mają (np. dodanych przed wdrożeniem tej funkcji).',
  })
  @ApiResponse({ status: 201, description: 'Liczba zaktualizowanych ćwiczeń', schema: { example: { updated: 3 } } })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  backfillEmbeddings() {
    return this.exerciseService.backfillEmbeddings()
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Zaktualizuj ćwiczenie (tylko administrator)',
    description: 'Aktualizuje nazwę i/lub grupę mięśniową. Jeśli zmieniono nazwę lub grupę, embedding jest regenerowany.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Zaktualizowane ćwiczenie', type: Exercise })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  updateExercise(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Usuń ćwiczenie (tylko administrator)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Ćwiczenie usunięte', type: Exercise })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Ćwiczenie nie istnieje', type: NotFoundErrorDto })
  removeExercise(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.remove(id)
  }
}
