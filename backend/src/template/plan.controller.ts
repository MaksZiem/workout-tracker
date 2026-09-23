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
import { PlanService } from './plan.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutPlanDto } from './dtos/create-workout-plan.dto';
import { UpdateWorkoutPlanDto } from './dtos/update-workout-plan.dto';
import { WorkoutPlan } from './workout-plan.entity';
import { NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('plan')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Utwórz plan treningowy', description: 'Plan grupuje wiele szablonów treningowych (np. plan tygodniowy złożony z dni Push/Pull/Legs).' })
  @ApiResponse({ status: 201, description: 'Plan utworzony', type: WorkoutPlan })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutPlanDto) {
    return this.planService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz wszystkie plany użytkownika' })
  @ApiResponse({ status: 200, description: 'Lista planów', type: WorkoutPlan, isArray: true })
  findAll(@CurrentUser() user: User) {
    return this.planService.findAllForUser(user.id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz szczegóły planu wraz z szablonami' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Szczegóły planu', type: WorkoutPlan })
  @ApiNotFoundResponse({ description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const plan = await this.planService.findOne(user.id, id);
    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }
    return plan;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj plan (nazwa, notatki)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Zaktualizowany plan', type: WorkoutPlan })
  @ApiNotFoundResponse({ description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutPlanDto,
  ) {
    return this.planService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Usuń plan', description: 'Usuwa plan. Przypisane szablony są kaskadowo usuwane wraz z planem.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Plan usunięty', type: WorkoutPlan })
  @ApiNotFoundResponse({ description: 'Plan nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.planService.remove(user.id, id);
  }
}
