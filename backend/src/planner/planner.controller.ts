import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlannerService } from './planner.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateScheduledWorkoutDto } from './dtos/create-scheduled-workout.dto';
import { UpdateScheduledWorkoutDto } from './dtos/update-scheduled-workout.dto';
import { FindScheduledWorkoutDto } from './dtos/find-scheduled-workout.dto';
import { GenerateScheduleDto } from './dtos/generate-schedule.dto';

@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('/scheduled')
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateScheduledWorkoutDto) {
    return this.plannerService.create(user, dto);
  }

  @Post('/generate')
  @UseGuards(AuthGuard)
  generate(@CurrentUser() user: User, @Body() dto: GenerateScheduleDto) {
    return this.plannerService.generate(user, dto);
  }

  @Get('/scheduled')
  @UseGuards(AuthGuard)
  findAll(
    @CurrentUser() user: User,
    @Query() filters: FindScheduledWorkoutDto,
  ) {
    return this.plannerService.findAllForUser(user.id, filters);
  }

  @Get('/today')
  @UseGuards(AuthGuard)
  findToday(@CurrentUser() user: User) {
    return this.plannerService.findToday(user.id);
  }

  @Patch('/scheduled/:id')
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledWorkoutDto,
  ) {
    return this.plannerService.update(user.id, id, dto);
  }

  @Delete('/scheduled/:id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.plannerService.remove(user.id, id);
  }

  @Post('/scheduled/:id/start')
  @UseGuards(AuthGuard)
  start(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.plannerService.start(user.id, id);
  }
}
