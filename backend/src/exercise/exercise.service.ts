import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { cosineSimilarity } from 'src/helpers/cosine-similarity';
import { GeminiService } from 'src/gemini/gemini.service';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import { WorkoutTemplateExercise } from 'src/template/workout-template-exercise.entity';

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);

  constructor(
    @InjectRepository(Exercise) private repo: Repository<Exercise>,
    private gemini: GeminiService,
  ) {}

  findAll(muscleGroup?: MuscleGroup) {
    return this.repo.find({
      where: muscleGroup ? { muscleGroup } : {},
    });
  }

  findOne(id: number) {
    return this.repo.findOneBy({id})
  }

  async create(dto: CreateExerciseDto): Promise<Exercise> {
    await this.assertNameFree(dto.name)
    const exercise = this.repo.create(dto)
    exercise.embedding = await this.tryEmbed(exercise.name, exercise.muscleGroup);
    return this.repo.save(exercise)
  }

  async update(id: number, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    if (dto.name !== undefined) {
      await this.assertNameFree(dto.name, id)
    }
    const changed =
      (dto.name !== undefined && dto.name !== exercise.name) ||
      (dto.muscleGroup !== undefined && dto.muscleGroup !== exercise.muscleGroup)
    assignDefined(exercise, dto)

    if (changed) {
      // Stary embedding opisywałby poprzednią nazwę, więc przy błędzie Gemini zostaje pusty.
      exercise.embedding = await this.tryEmbed(exercise.name, exercise.muscleGroup);
    }

    return this.repo.save(exercise)
  }

  /** Ile treningów i szablonów używa ćwiczenia (usunąć można tylko nieużywane). */
  async usage(id: number) {
    const exercise = await this.findOne(id)
    if (!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    const manager = this.repo.manager
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
    ])
    return { workoutCount: Number(workouts?.count ?? 0), templateCount: Number(templates?.count ?? 0) }
  }

  async remove(id: number) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    const { workoutCount, templateCount } = await this.usage(id)
    if (workoutCount || templateCount) {
      // Usunięcie skasowałoby historię użytkowników: zamiast tego można zmienić nazwę.
      throw new ConflictException(
        `Exercise is used in ${workoutCount} workout(s) and ${templateCount} template(s)`,
      )
    }
    return this.repo.remove(exercise)
  }

  // Znajduje najbardziej podobne ćwiczenia w tej samej grupie mięśniowej
  // (np. do podmiany przy braku sprzętu albo kontuzji).
  async findSimilar(id: number, limit = 5) {
    const exercise = await this.findOne(id);
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    if (!exercise.embedding) {
      throw new NotFoundException('Exercise has no embedding yet');
    }

    const candidates = await this.repo.find({
      where: { muscleGroup: exercise.muscleGroup },
    });

    return candidates
      .filter((c) => c.id !== exercise.id && c.embedding)
      .map((c) => ({
        exercise: c,
        similarity: cosineSimilarity(
          exercise.embedding as number[],
          c.embedding as number[],
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Dolicza embeddingi ćwiczeniom, które powstały zanim ta funkcja istniała.
  async backfillEmbeddings() {
    const exercises = await this.repo.find();
    const missing = exercises.filter((e) => !e.embedding);

    for (const exercise of missing) {
      exercise.embedding = await this.embed(exercise.name, exercise.muscleGroup);
      await this.repo.save(exercise);
    }

    return { updated: missing.length };
  }

  private embed(name: string, muscleGroup: MuscleGroup) {
    return this.gemini.embedText(`${name} (${muscleGroup})`);
  }

  // Awaria Gemini nie blokuje zapisu: brakujący embedding dolicza backfill.
  private async tryEmbed(name: string, muscleGroup: MuscleGroup) {
    try {
      return await this.embed(name, muscleGroup);
    } catch (error) {
      this.logger.warn(`Embedding failed for "${name}": ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  // Nazwy są unikalne bez względu na wielkość liter („Przysiad” i „przysiad” to to samo ćwiczenie).
  private async assertNameFree(name: string, exceptId?: number) {
    const query = this.repo
      .createQueryBuilder('e')
      .where('LOWER(e.name) = LOWER(:name)', { name: name.trim() })
    if (exceptId !== undefined) {
      query.andWhere('e.id != :exceptId', { exceptId })
    }
    if (await query.getExists()) {
      throw new ConflictException('Exercise with this name already exists')
    }
  }
}
