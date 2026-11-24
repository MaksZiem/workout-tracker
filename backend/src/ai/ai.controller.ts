import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  NotFoundErrorDto,
  TooManyRequestsErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { AiService } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { AiLimitGuard } from 'src/ai-usage/ai-limit.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { GenerateWorkoutPlanDto } from './dtos/generate-workout-plan.dto';
import { ParseWorkoutDto } from './dtos/parse-workout.dto';

@ApiTags('ai')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@ApiInternalServerErrorResponse({
  description: 'Błąd komunikacji z usługą AI (Gemini)',
})
@ApiTooManyRequestsResponse({
  description:
    'Dzienny limit wywołań AI na użytkownika wyczerpany (kod AI_DAILY_LIMIT, limit w params.limit)',
  type: TooManyRequestsErrorDto,
})
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('/generate-plan')
  @UseGuards(AuthGuard, AiLimitGuard)
  @ApiOperation({
    summary: 'Wygeneruj plan treningowy przy pomocy AI',
    description:
      'Na podstawie celu treningowego, liczby dni w tygodniu i opcjonalnych ograniczeń, model Gemini układa plan treningowy. Automatycznie tworzy nowy WorkoutPlan oraz po jednym WorkoutTemplate na każdy dzień treningowy, wypełniony ćwiczeniami wyłącznie z istniejącego katalogu ćwiczeń.',
  })
  @ApiCreatedResponse({
    description:
      'Wygenerowany i zapisany plan treningowy wraz z utworzonymi szablonami',
    schema: {
      example: {
        plan: {
          id: 'ae2a9494-544c-5951-b5d2-12c5a9f17bb6',
          name: 'Plan HYPERTROPHY — 4x/tydzień',
          notes: null,
          createdAt: '2026-09-23T12:00:00.000Z',
        },
        templates: [
          {
            id: '2100eb0b-9ddb-5edb-8ce6-f7992d93be17',
            name: 'Dzień 1 - Push',
            notes: 'Klatka, barki, triceps',
            exercises: [
              {
                id: 'bf24dc6b-4b30-5955-b259-348a76a3f1ff',
                order: 0,
                targetSets: 4,
                targetReps: 10,
                targetWeight: 60,
                restSeconds: 90,
                exercise: {
                  id: 'eef41190-e1f9-505c-a1e8-cb4440c3d597',
                  name: 'Wyciskanie sztangi leżąc',
                  muscleGroup: 'CHEST',
                },
              },
            ],
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Nieprawidłowe dane wejściowe (np. daysPerWeek poza zakresem 1-7)',
    type: BadRequestErrorDto,
  })
  generatePlan(@CurrentUser() user: User, @Body() dto: GenerateWorkoutPlanDto) {
    return this.aiService.generatePlan(user, dto);
  }

  @Post('/parse-workout')
  @UseGuards(AuthGuard, AiLimitGuard)
  @ApiOperation({
    summary: 'Rozpoznaj trening z opisu tekstowego (AI)',
    description:
      'Analizuje swobodny opis treningu w języku naturalnym za pomocą modelu Gemini, rozpoznaje wykonane ćwiczenia i serie (dopasowując je do istniejącego katalogu ćwiczeń) i dopisuje je do wskazanego, istniejącego treningu jako ukończone serie.',
  })
  @ApiCreatedResponse({
    description:
      'Zaktualizowany trening z dopisanymi ćwiczeniami i seriami rozpoznanymi z tekstu',
    schema: {
      example: {
        id: 'ec0b7ff2-74eb-5731-870e-c7e26cfdffc5',
        date: '2026-09-23',
        notes: null,
        exercises: [
          {
            id: '83a9a9fa-2b54-5dc2-831a-e1c15a715746',
            order: 0,
            exercise: {
              id: 'eef41190-e1f9-505c-a1e8-cb4440c3d597',
              name: 'Wyciskanie sztangi leżąc',
              muscleGroup: 'CHEST',
            },
            sets: [
              {
                id: 'ef92a62e-2818-58d3-8829-2b37094af78f',
                setNumber: 1,
                weight: 80,
                reps: 8,
                completed: true,
              },
              {
                id: '8e7fce63-401b-5f64-b547-7a37c1a0088e',
                setNumber: 2,
                weight: 80,
                reps: 8,
                completed: true,
              },
              {
                id: '03bf2b9c-8d6f-5a41-a8ff-0e42ef5e16a3',
                setNumber: 3,
                weight: 80,
                reps: 7,
                completed: true,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description:
      'Wskazany trening (workoutId) nie istnieje lub nie należy do użytkownika',
    type: NotFoundErrorDto,
  })
  parseWorkout(@CurrentUser() user: User, @Body() dto: ParseWorkoutDto) {
    return this.aiService.parseWorkout(user, dto);
  }
}
