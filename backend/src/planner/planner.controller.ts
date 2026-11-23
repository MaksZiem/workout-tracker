import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { PlannerService } from './planner.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateScheduledWorkoutDto } from './dtos/create-scheduled-workout.dto';
import { UpdateScheduledWorkoutDto } from './dtos/update-scheduled-workout.dto';
import { FindTodayDto } from './dtos/find-today.dto';
import { FindScheduledWorkoutDto } from './dtos/find-scheduled-workout.dto';
import { GenerateScheduleDto } from './dtos/generate-schedule.dto';
import { ScheduledWorkout } from './scheduled-workout.entity';

@ApiTags('planner')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('/scheduled')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaplanuj pojedynczy trening',
    description:
      'Umieszcza w kalendarzu jeden trening na podstawie wskazanego szablonu i daty.',
  })
  @ApiCreatedResponse({
    description: 'Trening zaplanowany',
    type: ScheduledWorkout,
  })
  @ApiNotFoundResponse({
    description:
      'Szablon treningowy nie istnieje lub nie należy do użytkownika',
    type: NotFoundErrorDto,
  })
  create(@CurrentUser() user: User, @Body() dto: CreateScheduledWorkoutDto) {
    return this.plannerService.create(user, dto);
  }

  @Post('/generate')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Wygeneruj harmonogram na zakres dat',
    description:
      'Rozkłada wskazane szablony na dni tygodnia w podanym zakresie dat (np. Push -> poniedziałek, Pull -> środa, Legs -> piątek). Dni, dla których w danym zakresie już istnieje zaplanowany trening, są pomijane - operacja jest bezpieczna do wielokrotnego wywołania.',
  })
  @ApiCreatedResponse({
    description: 'Lista nowo utworzonych zaplanowanych treningów',
    type: ScheduledWorkout,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'Jeden z podanych szablonów treningowych nie istnieje',
    type: NotFoundErrorDto,
  })
  generate(@CurrentUser() user: User, @Body() dto: GenerateScheduleDto) {
    return this.plannerService.generate(user, dto);
  }

  @Get('/scheduled')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Pobierz zaplanowane treningi',
    description:
      'Zwraca zaplanowane treningi użytkownika, opcjonalnie przefiltrowane po zakresie dat, posortowane rosnąco po dacie.',
  })
  @ApiOkResponse({
    description: 'Lista zaplanowanych treningów',
    type: ScheduledWorkout,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: User,
    @Query() filters: FindScheduledWorkoutDto,
  ) {
    return this.plannerService.findAllForUser(user.id, filters);
  }

  @Get('/today')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Pobierz dzisiejsze treningi',
    description:
      'Zwraca treningi zaplanowane na dzisiaj wraz z pełnymi danymi szablonu i ćwiczeń.',
  })
  @ApiOkResponse({
    description: 'Treningi zaplanowane na dziś',
    type: ScheduledWorkout,
    isArray: true,
  })
  findToday(@CurrentUser() user: User, @Query() query: FindTodayDto) {
    return this.plannerService.findToday(user.id, query.date);
  }

  @Patch('/scheduled/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj zaplanowany trening',
    description:
      'Pozwala zmienić datę i/lub status (PLANNED, IN_PROGRESS, COMPLETED, SKIPPED).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator zaplanowanego treningu',
  })
  @ApiOkResponse({
    description: 'Zaktualizowany zaplanowany trening',
    type: ScheduledWorkout,
  })
  @ApiNotFoundResponse({
    description:
      'Zaplanowany trening nie istnieje lub nie należy do użytkownika',
    type: NotFoundErrorDto,
  })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateScheduledWorkoutDto,
  ) {
    return this.plannerService.update(user.id, id, dto);
  }

  @Delete('/scheduled/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Usuń zaplanowany trening' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator zaplanowanego treningu',
  })
  @ApiOkResponse({
    description: 'Zaplanowany trening usunięty',
    type: ScheduledWorkout,
  })
  @ApiNotFoundResponse({
    description:
      'Zaplanowany trening nie istnieje lub nie należy do użytkownika',
    type: NotFoundErrorDto,
  })
  remove(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.plannerService.remove(user.id, id);
  }

  @Post('/scheduled/:id/start')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Rozpocznij zaplanowany trening',
    description:
      'Tworzy rzeczywisty trening (Workout) na podstawie szablonu przypisanego do zaplanowanej pozycji, wypełniając serie wartościami docelowymi z szablonu, a następnie oznacza pozycję w kalendarzu jako IN_PROGRESS. Status COMPLETED ustawia POST /workout/{id}/finish.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator zaplanowanego treningu',
  })
  @ApiCreatedResponse({
    description: 'Zaplanowany trening z powiązanym nowo utworzonym treningiem',
    type: ScheduledWorkout,
  })
  @ApiNotFoundResponse({
    description:
      'Zaplanowany trening nie istnieje, nie ma przypisanego szablonu, lub szablon nie istnieje',
    type: NotFoundErrorDto,
  })
  start(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.plannerService.start(user.id, id);
  }
}
