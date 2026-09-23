import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { GenerateWorkoutPlanDto } from './dtos/generate-workout-plan.dto';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('/generate-plan')
  @UseGuards(AuthGuard)
  generatePlan(@CurrentUser() user: User, @Body() dto: GenerateWorkoutPlanDto) {
    return this.aiService.generatePlan(user, dto);
  }
}
