import { Module } from "@nestjs/common";
import { ExerciseModule } from "src/exercise/exercise.module";
import { TemplateModule } from "src/template/template.module";
import { WorkoutModule } from "src/workout/workout.module";
import { UsersModule } from "src/users/users.module";
import { GeminiModule } from "src/gemini/gemini.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  imports: [ExerciseModule, TemplateModule, WorkoutModule, UsersModule, GeminiModule],
  controllers: [AiController],
  providers: [AiService]
})
export class AiModule {}
