import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ExerciseService } from 'src/exercise/exercise.service';
import { TemplateService } from 'src/template/template.service';
import { User } from 'src/users/user.entity';
import { GenerateWorkoutPlanDto } from './dtos/generate-workout-plan.dto';
import { workoutPlanSchema } from './schemas/workout-plan.schema';
import { WorkoutTemplate } from 'src/template/workout-template.entity';
import { PlanService } from 'src/template/plan.service';

interface GeneratedPlan {
  templates: {
    name: string;
    notes?: string;
    exercises: {
      exerciseId: number;
      order: number;
      targetSets: number;
      targetReps: number;
      targetWeight?: number;
      restSeconds?: number;
    }[];
  }[];
}

@Injectable()
export class AiService {
  constructor(
    private gemini: GeminiService,
    private exerciseService: ExerciseService,
    private templateService: TemplateService,
    private planService: PlanService,
  ) {}

  async generatePlan(user: User, dto: GenerateWorkoutPlanDto) {
    const exercises = await this.exerciseService.findAll()
    const validExercisesIds = new Set(exercises.map((e) => e.id))

    const prompt = this.buildPrompt(dto, exercises)
    const plan = await this.gemini.generateJson<GeneratedPlan>(
      prompt,
      workoutPlanSchema,
    );

    const workoutPlan = await this.planService.create(user, {
      name: `Plan ${dto.goal} — ${dto.daysPerWeek}x/tydzień`,
      notes: dto.constraints,
    });

    const createdTemplates: (WorkoutTemplate | null)[] = [];
    for (const template of plan.templates) {
      const created = await this.templateService.create(user, {
        name: template.name,
        notes: template.notes,
        planId: workoutPlan.id,
      });

      for (const exercise of template.exercises) {
        // Zabezpieczenie na wypadek, gdyby model jednak zwrócił id spoza listy
        if (!validExercisesIds.has(exercise.exerciseId)) continue;

        await this.templateService.addExercise(user.id, created.id, {
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetWeight: exercise.targetWeight,
          restSeconds: exercise.restSeconds,
        });
      }

      createdTemplates.push(
        await this.templateService.findOne(user.id, created.id),
      );
    }

    return { plan: workoutPlan, templates: createdTemplates };
  }

  private buildPrompt(
    dto: GenerateWorkoutPlanDto,
    exercises: { id: number; name: string; muscleGroup: string }[],
  ): string {
    const exerciseList = exercises
      .map((e) => `- id:${e.id} ${e.name} (${e.muscleGroup})`)
      .join('\n');

    return `Jesteś trenerem personalnym. Zaprojektuj plan treningowy.
        Cel: ${dto.goal}
        Liczba dni treningowych w tygodniu: ${dto.daysPerWeek}
        Dodatkowe ograniczenia: ${dto.constraints ?? 'brak'}
        Dostępne ćwiczenia (używaj WYŁĄCZNIE poniższych id, nie wymyślaj nowych):
        ${exerciseList}
        Zwróć ${dto.daysPerWeek} szablonów treningowych (po jednym na dzień treningowy), każdy z sensownym doborem ćwiczeń pod dany cel, w formacie JSON zgodnym z podanym schematem.`;
  }
}
