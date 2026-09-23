import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { cosineSimilarity } from 'src/helpers/cosine-similarity';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class ExerciseService {
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
    const exercise = this.repo.create(dto)
    exercise.embedding = await this.embed(exercise.name, exercise.muscleGroup);
    return this.repo.save(exercise)
  }

  async update(id: number, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    assignDefined(exercise, dto)

    if (dto.name || dto.muscleGroup) {
      exercise.embedding = await this.embed(exercise.name, exercise.muscleGroup);
    }

    return this.repo.save(exercise)
  }

  async remove(id: number) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
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
}
