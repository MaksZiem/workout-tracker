import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { hashPassword } from './helpers/hash-password';
import { UserRole } from './enums/user-role.enum';
import { MuscleGroup } from './enums/muscle-group.enum';
import { Exercise } from './exercise/exercise.entity';
import { Workout } from './workout/workout.entity';
import { WorkoutExercise } from './workout/workout-exercise.entity';
import { ExerciseSet } from './workout/exercise-set.entity';
import { PlanService } from './template/plan.service';
import { TemplateService } from './template/template.service';
import { PlannerService } from './planner/planner.service';

const SEED_EMAIL = 'jan.kowalski@example.com';
const SEED_PASSWORD = 'Haslo123!';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const exerciseRepo = app.get<Repository<Exercise>>(
    getRepositoryToken(Exercise),
  );
  const workoutRepo = app.get<Repository<Workout>>(getRepositoryToken(Workout));
  const workoutExerciseRepo = app.get<Repository<WorkoutExercise>>(
    getRepositoryToken(WorkoutExercise),
  );
  const exerciseSetRepo = app.get<Repository<ExerciseSet>>(
    getRepositoryToken(ExerciseSet),
  );
  const planService = app.get(PlanService);
  const templateService = app.get(TemplateService);
  const plannerService = app.get(PlannerService);

  const alreadySeeded = await usersService.find(SEED_EMAIL);
  if (alreadySeeded.length) {
    console.log(
      `Użytkownik ${SEED_EMAIL} już istnieje - baza wygląda na zaseedowaną. Przerywam, żeby nie tworzyć duplikatów.`,
    );
    await app.close();
    return;
  }

  console.log('Tworzę użytkownika...');
  const hashedPassword = await hashPassword(SEED_PASSWORD);
  const user = await usersService.create(
    SEED_EMAIL,
    hashedPassword,
    'Jan',
    'Kowalski',
  );
  await usersService.update(user.id, { role: UserRole.ADMIN });
  console.log(`Utworzono użytkownika: ${SEED_EMAIL} (rola: ADMIN)`);

  console.log('Tworzę katalog ćwiczeń...');
  // Wstawiamy bezpośrednio przez repozytorium (z pominięciem ExerciseService),
  // żeby seedowanie nie odpytywało Gemini o embedding dla każdego ćwiczenia.
  // Embeddingi doliczysz jednym POST /exercise/backfill-embeddings, kiedy
  // zechcesz przetestować /exercise/:id/similar.
  const exerciseSeeds: { name: string; muscleGroup: MuscleGroup }[] = [
    { name: 'Wyciskanie sztangi na ławce płaskiej', muscleGroup: MuscleGroup.CHEST },
    { name: 'Rozpiętki z hantlami', muscleGroup: MuscleGroup.CHEST },
    { name: 'Pompki na poręczach', muscleGroup: MuscleGroup.CHEST },
    { name: 'Wiosłowanie sztangą', muscleGroup: MuscleGroup.BACK },
    { name: 'Podciąganie na drążku', muscleGroup: MuscleGroup.BACK },
    { name: 'Ściąganie drążka wyciągu górnego', muscleGroup: MuscleGroup.BACK },
    { name: 'Wyciskanie żołnierskie', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Unoszenie hantli bokiem', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Uginanie ramion ze sztangą', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Uginanie ramion z hantlami (młotki)', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Wyciskanie francuskie', muscleGroup: MuscleGroup.TRICEPS },
    { name: 'Prostowanie ramion na wyciągu', muscleGroup: MuscleGroup.TRICEPS },
    { name: 'Przysiad ze sztangą', muscleGroup: MuscleGroup.LEGS },
    { name: 'Wykroki z hantlami', muscleGroup: MuscleGroup.LEGS },
    { name: 'Prasa nożna', muscleGroup: MuscleGroup.LEGS },
    { name: 'Martwy ciąg na prostych nogach', muscleGroup: MuscleGroup.GLUTES },
    { name: 'Hip thrust', muscleGroup: MuscleGroup.GLUTES },
    { name: 'Deska (plank)', muscleGroup: MuscleGroup.ABS },
    { name: 'Unoszenie nóg w zwisie', muscleGroup: MuscleGroup.ABS },
    { name: 'Burpees', muscleGroup: MuscleGroup.FULL_BODY },
    { name: 'Wiosłowanie na ergometrze', muscleGroup: MuscleGroup.CARDIO },
    { name: 'Bieg interwałowy', muscleGroup: MuscleGroup.CARDIO },
  ];
  const exercises = await exerciseRepo.save(
    exerciseSeeds.map((e) => exerciseRepo.create(e)),
  );
  console.log(`Utworzono ${exercises.length} ćwiczeń.`);

  const byName = (name: string) => exercises.find((e) => e.name === name)!;
  const routines = [
    [
      byName('Wyciskanie sztangi na ławce płaskiej'),
      byName('Rozpiętki z hantlami'),
      byName('Pompki na poręczach'),
    ],
    [
      byName('Wiosłowanie sztangą'),
      byName('Podciąganie na drążku'),
      byName('Uginanie ramion ze sztangą'),
    ],
    [
      byName('Przysiad ze sztangą'),
      byName('Wykroki z hantlami'),
      byName('Hip thrust'),
    ],
  ];

  console.log('Tworzę historię treningów (ostatnie ~3 tygodnie)...');
  const today = new Date();
  let workoutsCreated = 0;
  // 9 sesji wstecz, co 2 dni, naprzemiennie Push/Pull/Legs. Ciężar rośnie
  // z każdym kolejnym tygodniem, żeby na wykresach postępu było coś widać.
  for (let sessionsAgo = 8; sessionsAgo >= 0; sessionsAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - sessionsAgo * 2);
    const dateStr = date.toISOString().slice(0, 10);

    const routine = routines[sessionsAgo % routines.length];
    const weekIndex = Math.floor((8 - sessionsAgo) / 3);

    const workout = workoutRepo.create({
      date: dateStr,
      user,
      exercises: routine.map((exercise, order) =>
        workoutExerciseRepo.create({
          exercise,
          order,
          sets: [1, 2, 3].map((setNumber) =>
            exerciseSetRepo.create({
              setNumber,
              weight: 40 + weekIndex * 5 + order * 10,
              reps: 8,
              completed: true,
            }),
          ),
        }),
      ),
    });
    await workoutRepo.save(workout);
    workoutsCreated++;
  }
  console.log(`Utworzono ${workoutsCreated} historycznych treningów.`);

  console.log('Tworzę plan treningowy (WorkoutPlan + 3x WorkoutTemplate)...');
  const plan = await planService.create(user, {
    name: 'Plan hipertrofia - wrzesień 2026',
    notes: 'Klasyczny split Push/Pull/Legs',
  });

  const templateDefs = [
    { name: 'Push Day', exercises: routines[0] },
    { name: 'Pull Day', exercises: routines[1] },
    { name: 'Legs Day', exercises: routines[2] },
  ];

  const createdTemplates: { id: number }[] = [];
  for (const def of templateDefs) {
    const template = await templateService.create(user, {
      name: def.name,
      planId: plan.id,
    });
    for (let i = 0; i < def.exercises.length; i++) {
      await templateService.addExercise(user.id, template.id, {
        exerciseId: def.exercises[i].id,
        order: i,
        targetSets: 4,
        targetReps: 8,
        targetWeight: 60,
        restSeconds: 90,
      });
    }
    createdTemplates.push(template);
  }
  console.log(
    `Utworzono plan "${plan.name}" z ${createdTemplates.length} szablonami.`,
  );

  console.log('Rozkładam plan na kalendarz (najbliższe 3 tygodnie)...');
  const from = today.toISOString().slice(0, 10);
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 21);
  const to = toDate.toISOString().slice(0, 10);

  const scheduled = await plannerService.generate(user, {
    from,
    to,
    assignments: [
      { templateId: createdTemplates[0].id, dayOfWeek: 1 }, // poniedziałek
      { templateId: createdTemplates[1].id, dayOfWeek: 3 }, // środa
      { templateId: createdTemplates[2].id, dayOfWeek: 5 }, // piątek
    ],
  });
  console.log(`Zaplanowano ${scheduled.length} przyszłych treningów w kalendarzu.`);

  console.log('\nGotowe! Zaloguj się:');
  console.log(`  email: ${SEED_EMAIL}`);
  console.log(`  hasło: ${SEED_PASSWORD}`);

  await app.close();
}

seed().catch((err) => {
  console.error('Seed nie powiódł się:', err);
  process.exit(1);
});
