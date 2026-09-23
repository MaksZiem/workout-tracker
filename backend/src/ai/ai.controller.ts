import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { GenerateWorkoutPlanDto } from './dtos/generate-workout-plan.dto';
import { ParseWorkoutDto } from './dtos/parse-workout.dto';
import { NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@ApiInternalServerErrorResponse({ description: 'Błąd komunikacji z usługą AI (Gemini)' })
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('/generate-plan')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Wygeneruj plan treningowy przy pomocy AI',
    description:
      'Na podstawie celu treningowego, liczby dni w tygodniu i opcjonalnych ograniczeń, model Gemini układa plan treningowy. Automatycznie tworzy nowy WorkoutPlan oraz po jednym WorkoutTemplate na każdy dzień treningowy, wypełniony ćwiczeniami wyłącznie z istniejącego katalogu ćwiczeń.',
  })
  @ApiResponse({
    status: 201,
    description: 'Wygenerowany i zapisany plan treningowy wraz z utworzonymi szablonami',
    schema: {
      example: {
        plan: {
          id: 5,
          name: 'Plan HYPERTROPHY — 4x/tydzień',
          notes: null,
          createdAt: '2026-09-23T12:00:00.000Z',
        },
        templates: [
          {
            id: 12,
            name: 'Dzień 1 - Push',
            notes: 'Klatka, barki, triceps',
            exercises: [
              {
                id: 40,
                order: 0,
                targetSets: 4,
                targetReps: 10,
                targetWeight: 60,
                restSeconds: 90,
                exercise: { id: 1, name: 'Wyciskanie sztangi leżąc', muscleGroup: 'CHEST' },
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe (np. daysPerWeek poza zakresem 1-7)' })
  generatePlan(@CurrentUser() user: User, @Body() dto: GenerateWorkoutPlanDto) {
    return this.aiService.generatePlan(user, dto);
  }

  @Post('/parse-workout')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Rozpoznaj trening z opisu tekstowego (AI)',
    description:
      'Analizuje swobodny opis treningu w języku naturalnym za pomocą modelu Gemini, rozpoznaje wykonane ćwiczenia i serie (dopasowując je do istniejącego katalogu ćwiczeń) i dopisuje je do wskazanego, istniejącego treningu jako ukończone serie.',
  })
  @ApiResponse({
    status: 201,
    description: 'Zaktualizowany trening z dopisanymi ćwiczeniami i seriami rozpoznanymi z tekstu',
    schema: {
      example: {
        id: 10,
        date: '2026-09-23',
        notes: null,
        exercises: [
          {
            id: 55,
            order: 0,
            exercise: { id: 1, name: 'Wyciskanie sztangi leżąc', muscleGroup: 'CHEST' },
            sets: [
              { id: 201, setNumber: 1, weight: 80, reps: 8, completed: true },
              { id: 202, setNumber: 2, weight: 80, reps: 8, completed: true },
              { id: 203, setNumber: 3, weight: 80, reps: 7, completed: true },
            ],
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Wskazany trening (workoutId) nie istnieje lub nie należy do użytkownika', type: NotFoundErrorDto })
  parseWorkout(@CurrentUser() user: User, @Body() dto: ParseWorkoutDto) {
    return this.aiService.parseWorkout(user, dto);
  }
}
