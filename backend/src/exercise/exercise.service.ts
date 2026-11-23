import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { errorBody } from 'src/common/error-body';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { GeminiService } from 'src/gemini/gemini.service';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import { ExerciseSubstitute } from './exercise-substitute.entity';
import { substitutesSchema } from './substitutes.schema';
import { WorkoutTemplateExercise } from 'src/template/workout-template-exercise.entity';

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);

  constructor(
    @InjectRepository(Exercise) private repo: Repository<Exercise>,
    @InjectRepository(ExerciseSubstitute)
    private substitutes: Repository<ExerciseSubstitute>,
    private gemini: GeminiService,
  ) {}

  findAll(muscleGroup?: MuscleGroup) {
    return this.repo.find({
      where: muscleGroup ? { muscleGroup } : {},
    });
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async create(dto: CreateExerciseDto): Promise<Exercise> {
    await this.assertNameFree(dto.name);
    const exercise = await this.repo.save(this.repo.create(dto));
    return this.tryGenerateSubstitutes(exercise);
  }

  async update(id: string, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'EXERCISE_NOT_FOUND',
          'Exercise not found',
        ),
      );
    }
    if (dto.name !== undefined) {
      await this.assertNameFree(dto.name, id);
    }
    const changed =
      (dto.name !== undefined && dto.name !== exercise.name) ||
      (dto.muscleGroup !== undefined &&
        dto.muscleGroup !== exercise.muscleGroup);
    assignDefined(exercise, dto);
    const saved = await this.repo.save(exercise);
    return changed
      ? this.tryGenerateSubstitutes(saved, { resetOnFailure: true })
      : saved;
  }

  async usage(id: string) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'EXERCISE_NOT_FOUND',
          'Exercise not found',
        ),
      );
    }
    const manager = this.repo.manager;
    const [workouts, templates] = await Promise.all([
      manager
        .createQueryBuilder(WorkoutExercise, 'we')
        .select('COUNT(DISTINCT we.workoutId)', 'count')
        .where('we.exerciseId = :id', { id })
        .getRawOne<{ count: string }>(),
      manager
        .createQueryBuilder(WorkoutTemplateExercise, 'te')
        .select('COUNT(DISTINCT te.templateId)', 'count')
        .where('te.exerciseId = :id', { id })
        .getRawOne<{ count: string }>(),
    ]);
    return {
      workoutCount: Number(workouts?.count ?? 0),
      templateCount: Number(templates?.count ?? 0),
    };
  }

  async remove(id: string) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'EXERCISE_NOT_FOUND',
          'Exercise not found',
        ),
      );
    }
    const { workoutCount, templateCount } = await this.usage(id);
    if (workoutCount || templateCount) {
      throw new ConflictException(
        errorBody(
          HttpStatus.CONFLICT,
          'EXERCISE_IN_USE',
          `Exercise is used in ${workoutCount} workout(s) and ${templateCount} template(s)`,
          { workoutCount, templateCount },
        ),
      );
    }
    return this.repo.remove(exercise);
  }

  async findSubstitutes(id: string) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'EXERCISE_NOT_FOUND',
          'Exercise not found',
        ),
      );
    }
    const rows = await this.substitutes.find({
      where: { exercise: { id } },
      order: { rank: 'ASC' },
    });
    return rows.map((r) => ({ exercise: r.substitute, reason: r.reason }));
  }

  async generateSubstitutes(id: string) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'EXERCISE_NOT_FOUND',
          'Exercise not found',
        ),
      );
    }
    const picked = await this.pickSubstitutes(
      [exercise],
      await this.repo.find(),
    );
    await this.saveSubstitutes(id, picked.get(id) ?? []);
    return this.findSubstitutes(id);
  }

  async generateAllSubstitutes(onlyMissing: boolean) {
    const catalog = await this.repo.find({ order: { name: 'ASC' } });
    const targets = onlyMissing
      ? catalog.filter((e) => !e.substitutesGeneratedAt)
      : catalog;
    let updated = 0;
    const failed: string[] = [];

    for (let i = 0; i < targets.length; i += SUBSTITUTES_BATCH) {
      const batch = targets.slice(i, i + SUBSTITUTES_BATCH);
      let picked: Map<string, PickedSubstitute[]>;
      try {
        picked = await this.pickSubstitutes(batch, catalog, {
          retryOnTransient: true,
        });
      } catch {
        failed.push(...batch.map((e) => e.name));
        continue;
      }
      for (const exercise of batch) {
        await this.saveSubstitutes(exercise.id, picked.get(exercise.id) ?? []);
        updated++;
      }
    }
    return { updated, failed };
  }

  async removeSubstitute(id: string, substituteId: string) {
    const result = await this.substitutes.delete({
      exercise: { id },
      substitute: { id: substituteId },
    });
    if (!result.affected) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'SUBSTITUTE_NOT_FOUND',
          'Substitute not found',
        ),
      );
    }
    return this.findSubstitutes(id);
  }

  private async tryGenerateSubstitutes(
    exercise: Exercise,
    options = { resetOnFailure: false },
  ) {
    try {
      await this.generateSubstitutes(exercise.id);
    } catch {
      if (options.resetOnFailure) {
        await this.repo.manager.transaction(async (manager) => {
          await manager.delete(ExerciseSubstitute, {
            exercise: { id: exercise.id },
          });
          await manager.update(Exercise, exercise.id, {
            substitutesGeneratedAt: null,
          });
        });
      }
    }
    return (await this.findOne(exercise.id)) ?? exercise;
  }

  private async pickSubstitutes(
    targets: Exercise[],
    catalog: Exercise[],
    options = { retryOnTransient: false },
  ): Promise<Map<string, PickedSubstitute[]>> {
    const prompt = this.substitutesPrompt(targets, catalog);
    let answer: {
      results: { exerciseId: string; substitutes: PickedSubstitute[] }[];
    };
    try {
      answer = await this.gemini.generateJson(prompt, substitutesSchema);
    } catch (error) {
      const delay = options.retryOnTransient
        ? transientRetryDelay(error)
        : null;
      if (delay === null) {
        this.logger.warn(
          `Substitutes failed for ${targets.length} exercise(s): ${errorMessage(error)}`,
        );
        throw new BadGatewayException(
          errorBody(
            HttpStatus.BAD_GATEWAY,
            'AI_UNAVAILABLE',
            'AI could not pick substitutes, try again later',
          ),
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.pickSubstitutes(targets, catalog);
    }

    const valid = new Set(catalog.map((e) => e.id));
    const wanted = new Set(targets.map((e) => e.id));
    const result = new Map<string, PickedSubstitute[]>();
    for (const entry of answer.results ?? []) {
      if (!wanted.has(entry.exerciseId) || result.has(entry.exerciseId))
        continue;
      const seen = new Set<string>([entry.exerciseId]);
      result.set(
        entry.exerciseId,
        (entry.substitutes ?? [])
          .filter(
            (s) =>
              valid.has(s.exerciseId) &&
              !seen.has(s.exerciseId) &&
              seen.add(s.exerciseId),
          )
          .slice(0, 5),
      );
    }
    return result;
  }

  private async saveSubstitutes(id: string, picked: PickedSubstitute[]) {
    await this.repo.manager.transaction(async (manager) => {
      await manager.delete(ExerciseSubstitute, { exercise: { id } });
      await manager.save(
        picked.map((s, rank) =>
          manager.create(ExerciseSubstitute, {
            exercise: { id },
            substitute: { id: s.exerciseId },
            reason: s.reason.trim().slice(0, 200),
            rank,
          }),
        ),
      );
      await manager.update(Exercise, id, {
        substitutesGeneratedAt: new Date(),
      });
    });
  }

  private substitutesPrompt(targets: Exercise[], catalog: Exercise[]) {
    const line = (e: Exercise) => `${e.id} | ${e.name} | ${e.muscleGroup}`;
    return `Jesteś doświadczonym trenerem przygotowania siłowego.

Dla każdego ćwiczenia z listy "Ćwiczenia" wybierz z "Katalogu" ćwiczenia, które są dobrym zamiennikiem
w planie treningowym, np. gdy sprzęt jest zajęty albo coś boli. Dobry zamiennik:
- ma ten sam wzorzec ruchu (np. pionowe przyciąganie, poziome wypychanie, przysiad, zawias biodrowy),
- angażuje te same główne mięśnie w podobnym zakresie,
- pozwala utrzymać cel treningu bez zmiany reszty planu.
Sama przynależność do tej samej grupy mięśniowej NIE wystarcza: ćwiczenie o innym wzorcu ruchu nie jest zamiennikiem.
Dla każdego ćwiczenia zwróć od 0 do 5 zamienników, od najlepszego. Jeśli żaden nie pasuje, zwróć pustą listę -
to lepsze niż słaby zamiennik. Ćwiczenie nie może być zamiennikiem samego siebie.
Do każdego zamiennika dodaj jedno krótkie zdanie po polsku (do 80 znaków), co łączy oba ćwiczenia.
Używaj wyłącznie id z katalogu. Zwróć wynik dla każdego ćwiczenia z listy.

Ćwiczenia (id | nazwa | grupa):
${targets.map(line).join('\n')}

Katalog (id | nazwa | grupa):
${catalog.map(line).join('\n')}`;
  }

  private async assertNameFree(name: string, exceptId?: string) {
    const query = this.repo
      .createQueryBuilder('e')
      .where('LOWER(e.name) = LOWER(:name)', { name: name.trim() });
    if (exceptId !== undefined) {
      query.andWhere('e.id != :exceptId', { exceptId });
    }
    if (await query.getExists()) {
      throw new ConflictException(
        errorBody(
          HttpStatus.CONFLICT,
          'EXERCISE_NAME_TAKEN',
          'Exercise with this name already exists',
        ),
      );
    }
  }
}

const SUBSTITUTES_BATCH = 20;

type PickedSubstitute = { exerciseId: string; reason: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function transientRetryDelay(error: unknown): number | null {
  const message = errorMessage(error);
  if (message.includes('"code":503')) return 5000;
  if (!message.includes('"code":429')) return null;
  const seconds = Number(/"retryDelay":"(\d+)s"/.exec(message)?.[1] ?? 30);
  return Math.min(seconds + 1, 60) * 1000;
}
