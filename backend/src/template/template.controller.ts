import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutTemplateDto } from './dtos/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dtos/update-workout-template.dto';
import { AddTemplateExerciseDto } from './dtos/add-template-exercise.dto';
import { UpdateTemplateExerciseDto } from './dtos/update-template-exercise.dto';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutTemplateDto) {
    return this.templateService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.templateService.findAllForUser(user.id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.templateService.findOne(user.id, id);
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutTemplateDto,
  ) {
    return this.templateService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.templateService.remove(user.id, id);
  }

  // template exercise

  @Post('/:templateId/exercise')
  @UseGuards(AuthGuard)
  addExercise(
    @CurrentUser() user: User,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: AddTemplateExerciseDto,
  ) {
    return this.templateService.addExercise(user.id, templateId, dto);
  }

  @Patch('/:templateId/exercise/:teId')
  @UseGuards(AuthGuard)
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
  removeExercise(
    @CurrentUser() user: User,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('teId', ParseIntPipe) teId: number,
  ) {
    return this.templateService.removeExercise(user.id, templateId, teId);
  }
}
