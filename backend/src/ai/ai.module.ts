import { Module } from "@nestjs/common";
import { ExerciseModule } from "src/exercise/exercise.module";
import { TemplateModule } from "src/template/template.module";
import { WorkoutModule } from "src/workout/workout.module";
import { UsersModule } from "src/users/users.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { GeminiService } from "./gemini.service";

@Module({
  imports: [ExerciseModule, TemplateModule, WorkoutModule, UsersModule],
  controllers: [AiController],
  providers: [AiService, GeminiService]
})
export class AiModule {}