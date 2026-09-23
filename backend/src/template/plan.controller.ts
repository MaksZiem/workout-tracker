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
import { PlanService } from './plan.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateWorkoutPlanDto } from './dtos/create-workout-plan.dto';
import { UpdateWorkoutPlanDto } from './dtos/update-workout-plan.dto';

@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutPlanDto) {
    return this.planService.create(user, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.planService.findAllForUser(user.id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.planService.findOne(user.id, id);
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutPlanDto,
  ) {
    return this.planService.update(user.id, id, dto);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.planService.remove(user.id, id);
  }
}
