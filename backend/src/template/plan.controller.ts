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
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { errorBody } from 'src/common/error-body';
import {
  ApiBadRequestResponse,
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
  BadRequestErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { PlanService } from './plan.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutPlanDto } from './dtos/create-workout-plan.dto';
import { UpdateWorkoutPlanDto } from './dtos/update-workout-plan.dto';
import { WorkoutPlan } from './workout-plan.entity';

@ApiTags('plan')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Utwórz plan treningowy',
    description:
      'Plan grupuje wiele szablonów treningowych (np. plan tygodniowy złożony z dni Push/Pull/Legs).',
  })
  @ApiCreatedResponse({ description: 'Plan utworzony', type: WorkoutPlan })
  @ApiBadRequestResponse({
    description: 'Nieprawidłowe dane wejściowe',
    type: BadRequestErrorDto,
  })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutPlanDto) {
    return this.planService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz wszystkie plany użytkownika' })
  @ApiOkResponse({
    description: 'Lista planów',
    type: WorkoutPlan,
    isArray: true,
  })
  findAll(@CurrentUser() user: User) {
    return this.planService.findAllForUser(user.id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz szczegóły planu wraz z szablonami' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator planu',
  })
  @ApiOkResponse({ description: 'Szczegóły planu', type: WorkoutPlan })
  @ApiNotFoundResponse({
    description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
  ) {
    const plan = await this.planService.findOne(user.id, id);
    if (!plan) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PLAN_NOT_FOUND',
          'Workout plan not found',
        ),
      );
    }
    return plan;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj plan (nazwa, notatki)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator planu',
  })
  @ApiOkResponse({ description: 'Zaktualizowany plan', type: WorkoutPlan })
  @ApiNotFoundResponse({
    description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateWorkoutPlanDto,
  ) {
    return this.planService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Usuń plan',
    description:
      'Usuwa plan. Przypisane szablony są kaskadowo usuwane wraz z planem.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Identyfikator planu',
  })
  @ApiOkResponse({ description: 'Plan usunięty', type: WorkoutPlan })
  @ApiNotFoundResponse({
    description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika',
    type: NotFoundErrorDto,
  })
  remove(@CurrentUser() user: User, @Param('id', ParseIdPipe) id: string) {
    return this.planService.remove(user.id, id);
  }
}
