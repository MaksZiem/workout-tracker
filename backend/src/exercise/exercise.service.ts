import { BadGatewayException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
    @InjectRepository(ExerciseSubstitute) private substitutes: Repository<ExerciseSubstitute>,
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
    const exercise = await this.repo.save(this.repo.create(dto))
    return this.tryGenerateSubstitutes(exercise)
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
    const saved = await this.repo.save(exercise)
    // Nowa nazwa albo grupa to może być inne ćwiczenie: zamienniki dobieramy od nowa.
    return changed ? this.tryGenerateSubstitutes(saved, { resetOnFailure: true }) : saved
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

  /** Zamienniki dobrane przez AI, od najlepszego, z uzasadnieniem. */
  async findSubstitutes(id: number) {
    const exercise = await this.findOne(id)
    if (!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    const rows = await this.substitutes.find({
      where: { exercise: { id } },
      order: { rank: 'ASC' },
    })
    return rows.map((r) => ({ exercise: r.substitute, reason: r.reason }))
  }

  /**
   * Gemini wybiera z katalogu ćwiczenia, które naprawdę zastąpią dane ćwiczenie
   * (ten sam wzorzec ruchu i główne mięśnie), i uzasadnia każdy wybór. Wynik zastępuje
   * poprzednią listę.
   */
  async generateSubstitutes(id: number) {
    const exercise = await this.findOne(id)
    if (!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    const picked = await this.pickSubstitutes([exercise], await this.repo.find())
    await this.saveSubstitutes(id, picked.get(id) ?? [])
    return this.findSubstitutes(id)
  }

  /**
   * Dobiera zamienniki dla ćwiczeń, które ich jeszcze nie mają (albo dla wszystkich, np. po
   * rozbudowie katalogu). Jedno zapytanie do Gemini obsługuje całą paczkę ćwiczeń, bo darmowy
   * limit to kilka zapytań na minutę; po przejściowym błędzie (limit, przeciążenie) paczka czeka i próbuje raz jeszcze.
   */
  async generateAllSubstitutes(onlyMissing: boolean) {
    const catalog = await this.repo.find({ order: { id: 'ASC' } })
    const targets = onlyMissing ? catalog.filter((e) => !e.substitutesGeneratedAt) : catalog
    let updated = 0
    const failed: string[] = []

    for (let i = 0; i < targets.length; i += SUBSTITUTES_BATCH) {
      const batch = targets.slice(i, i + SUBSTITUTES_BATCH)
      let picked: Map<number, PickedSubstitute[]>
      try {
        picked = await this.pickSubstitutes(batch, catalog, { retryOnTransient: true })
      } catch {
        failed.push(...batch.map((e) => e.name))
        continue
      }
      for (const exercise of batch) {
        // Ćwiczenie pominięte w odpowiedzi też jest „dobrane”: AI nie znalazło zamiennika.
        await this.saveSubstitutes(exercise.id, picked.get(exercise.id) ?? [])
        updated++
      }
    }
    return { updated, failed }
  }

  /** Administrator odrzuca zamiennik, z którym się nie zgadza. */
  async removeSubstitute(id: number, substituteId: number) {
    const result = await this.substitutes.delete({ exercise: { id }, substitute: { id: substituteId } })
    if (!result.affected) {
      throw new NotFoundException('Substitute not found')
    }
    return this.findSubstitutes(id)
  }

  // Awaria Gemini nie blokuje zapisu ćwiczenia: zamienniki można dobrać później z panelu admina.
  // Po zmianie nazwy lub grupy stare zamienniki mogą już nie pasować, więc przy awarii znikają,
  // a ćwiczenie wraca do stanu „niedobrane” (substitutesGeneratedAt = null).
  private async tryGenerateSubstitutes(exercise: Exercise, options = { resetOnFailure: false }) {
    try {
      await this.generateSubstitutes(exercise.id)
    } catch {
      if (options.resetOnFailure) {
        await this.repo.manager.transaction(async (manager) => {
          await manager.delete(ExerciseSubstitute, { exercise: { id: exercise.id } })
          await manager.update(Exercise, exercise.id, { substitutesGeneratedAt: null })
        })
      }
    }
    return (await this.findOne(exercise.id)) ?? exercise
  }

  /** Jedno zapytanie do Gemini o zamienniki dla kilku ćwiczeń naraz; zwraca tylko poprawne id z katalogu. */
  private async pickSubstitutes(targets: Exercise[], catalog: Exercise[], options = { retryOnTransient: false }) {
    const prompt = this.substitutesPrompt(targets, catalog)
    let answer: { results: { exerciseId: number; substitutes: PickedSubstitute[] }[] }
    try {
      answer = await this.gemini.generateJson(prompt, substitutesSchema)
    } catch (error) {
      const delay = options.retryOnTransient ? transientRetryDelay(error) : null
      if (delay === null) {
        this.logger.warn(`Substitutes failed for ${targets.length} exercise(s): ${errorMessage(error)}`)
        throw new BadGatewayException('AI could not pick substitutes, try again later')
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.pickSubstitutes(targets, catalog)
    }

    const valid = new Set(catalog.map((e) => e.id))
    const wanted = new Set(targets.map((e) => e.id))
    const result = new Map<number, PickedSubstitute[]>()
    for (const entry of answer.results ?? []) {
      if (!wanted.has(entry.exerciseId) || result.has(entry.exerciseId)) continue
      const seen = new Set<number>([entry.exerciseId])
      result.set(
        entry.exerciseId,
        (entry.substitutes ?? [])
          .filter((s) => valid.has(s.exerciseId) && !seen.has(s.exerciseId) && seen.add(s.exerciseId))
          .slice(0, 5),
      )
    }
    return result
  }

  private async saveSubstitutes(id: number, picked: PickedSubstitute[]) {
    await this.repo.manager.transaction(async (manager) => {
      await manager.delete(ExerciseSubstitute, { exercise: { id } })
      await manager.save(
        picked.map((s, rank) =>
          manager.create(ExerciseSubstitute, {
            exercise: { id },
            substitute: { id: s.exerciseId },
            reason: s.reason.trim().slice(0, 200),
            rank,
          }),
        ),
      )
      await manager.update(Exercise, id, { substitutesGeneratedAt: new Date() })
    })
  }

  private substitutesPrompt(targets: Exercise[], catalog: Exercise[]) {
    const line = (e: Exercise) => `${e.id} | ${e.name} | ${e.muscleGroup}`
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
${catalog.map(line).join('\n')}`
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

/** Ile ćwiczeń idzie w jednym zapytaniu do Gemini przy dobieraniu hurtem. */
const SUBSTITUTES_BATCH = 20

type PickedSubstitute = { exerciseId: number; reason: string }

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Ile odczekać przed ponowieniem po przejściowym błędzie Gemini: 429 (limit zapytań, czas z "retryDelay",
 * najwyżej minuta) albo 503 (model chwilowo przeciążony). null dla pozostałych błędów.
 */
function transientRetryDelay(error: unknown): number | null {
  const message = errorMessage(error)
  if (message.includes('"code":503')) return 5000
  if (!message.includes('"code":429')) return null
  const seconds = Number(/"retryDelay":"(\d+)s"/.exec(message)?.[1] ?? 30)
  return Math.min(seconds + 1, 60) * 1000
}
