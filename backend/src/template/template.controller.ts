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
import { TemplateService } from './template.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutTemplateDto } from './dtos/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dtos/update-workout-template.dto';
import { AddTemplateExerciseDto } from './dtos/add-template-exercise.dto';
import { UpdateTemplateExerciseDto } from './dtos/update-template-exercise.dto';
import { WorkoutTemplate } from './workout-template.entity';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';
import { NotFoundErrorDto, UnauthorizedErrorDto } from 'src/common/dtos/error-response.dto';

@ApiTags('template')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Utwórz szablon treningowy', description: 'Tworzy pusty szablon (bez ćwiczeń), opcjonalnie przypisany do planu.' })
  @ApiResponse({ status: 201, description: 'Szablon utworzony', type: WorkoutTemplate })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane wejściowe' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutTemplateDto) {
    return this.templateService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz wszystkie szablony użytkownika' })
  @ApiResponse({ status: 200, description: 'Lista szablonów', type: WorkoutTemplate, isArray: true })
  findAll(@CurrentUser() user: User) {
    return this.templateService.findAllForUser(user.id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Pobierz szczegóły szablonu wraz z ćwiczeniami' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Szczegóły szablonu', type: WorkoutTemplate })
  @ApiNotFoundResponse({ description: 'Szablon nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const template = await this.templateService.findOne(user.id, id);
    if (!template) {
      throw new NotFoundException('Workout template not found');
    }
    return template;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj szablon (nazwa, notatki)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Zaktualizowany szablon', type: WorkoutTemplate })
  @ApiNotFoundResponse({ description: 'Szablon nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutTemplateDto,
  ) {
    return this.templateService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Usuń szablon', description: 'Usuwa szablon wraz ze wszystkimi jego ćwiczeniami (kaskadowo).' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Szablon usunięty', type: WorkoutTemplate })
  @ApiNotFoundResponse({ description: 'Szablon nie istnieje lub nie należy do zalogowanego użytkownika', type: NotFoundErrorDto })
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.templateService.remove(user.id, id);
  }

  // template exercise

  @Post('/:templateId/exercise')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Dodaj ćwiczenie do szablonu', description: 'Dołącza ćwiczenie z globalnego katalogu wraz z docelowymi seriami/powtórzeniami/ciężarem.' })
  @ApiParam({ name: 'templateId', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Ćwiczenie dodane do szablonu', type: WorkoutTemplateExercise })
  @ApiNotFoundResponse({ description: 'Szablon lub ćwiczenie nie istnieje', type: NotFoundErrorDto })
  addExercise(
    @CurrentUser() user: User,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: AddTemplateExerciseDto,
  ) {
    return this.templateService.addExercise(user.id, templateId, dto);
  }

  @Patch('/:templateId/exercise/:teId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Zaktualizuj ćwiczenie w szablonie' })
  @ApiParam({ name: 'templateId', type: Number, example: 1 })
  @ApiParam({ name: 'teId', type: Number, example: 3, description: 'Identyfikator wpisu ćwiczenia w szablonie' })
  @ApiResponse({ status: 200, description: 'Zaktualizowane ćwiczenie szablonu', type: WorkoutTemplateExercise })
  @ApiNotFoundResponse({ description: 'Wpis ćwiczenia nie istnieje w tym szablonie', type: NotFoundErrorDto })
  updateExercise(
    @CurrentUser() user: User,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('teId', ParseIntPipe) teId: number,
    @Body() dto: UpdateTemplateExerciseDto,
  ) {
    return this.templateService.updateExercise(user.id, templateId, teId, dto);
  }

  @Delete('/:templateId/exercise/:teId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Usuń ćwiczenie z szablonu' })
  @ApiParam({ name: 'templateId', type: Number, example: 1 })
  @ApiParam({ name: 'teId', type: Number, example: 3, description: 'Identyfikator wpisu ćwiczenia w szablonie' })
  @ApiResponse({ status: 200, description: 'Ćwiczenie usunięte z szablonu', type: WorkoutTemplateExercise })
  @ApiNotFoundResponse({ description: 'Wpis ćwiczenia nie istnieje w tym szablonie', type: NotFoundErrorDto })
  removeExercise(
    @CurrentUser() user: User,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('teId', ParseIntPipe) teId: number,
  ) {
    return this.templateService.removeExercise(user.id, templateId, teId);
  }
}
