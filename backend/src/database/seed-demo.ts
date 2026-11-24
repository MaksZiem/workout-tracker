import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { hashPassword } from '../helpers/hash-password';
import { MuscleGroup } from '../enums/muscle-group.enum';
import { Exercise } from '../exercise/exercise.entity';
import { Workout } from '../workout/workout.entity';
import { WorkoutExercise } from '../workout/workout-exercise.entity';
import { ExerciseSet } from '../workout/exercise-set.entity';
import { PlanService } from '../template/plan.service';
import { TemplateService } from '../template/template.service';
import { PlannerService } from '../planner/planner.service';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../demo/demo-account';

const CATALOG: { name: string; muscleGroup: MuscleGroup }[] = [
  {
    name: 'Wyciskanie sztangi na ławce płaskiej',
    muscleGroup: MuscleGroup.CHEST,
  },
  { name: 'Rozpiętki z hantlami', muscleGroup: MuscleGroup.CHEST },
  { name: 'Pompki na poręczach', muscleGroup: MuscleGroup.CHEST },
  { name: 'Wiosłowanie sztangą', muscleGroup: MuscleGroup.BACK },
  { name: 'Podciąganie na drążku', muscleGroup: MuscleGroup.BACK },
  { name: 'Ściąganie drążka wyciągu górnego', muscleGroup: MuscleGroup.BACK },
  { name: 'Wyciskanie żołnierskie', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Unoszenie hantli bokiem', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Uginanie ramion ze sztangą', muscleGroup: MuscleGroup.BICEPS },
  {
    name: 'Uginanie ramion z hantlami (młotki)',
    muscleGroup: MuscleGroup.BICEPS,
  },
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

const ROUTINES = [
  [
    'Wyciskanie sztangi na ławce płaskiej',
    'Rozpiętki z hantlami',
    'Pompki na poręczach',
  ],
  [
    'Wiosłowanie sztangą',
    'Podciąganie na drążku',
    'Uginanie ramion ze sztangą',
  ],
  ['Przysiad ze sztangą', 'Wykroki z hantlami', 'Hip thrust'],
];

const TEMPLATE_NAMES = ['Push Day', 'Pull Day', 'Legs Day'];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seedDemo() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

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

  for (const existing of await usersService.find(DEMO_EMAIL)) {
    await usersService.remove(existing.id);
  }

  for (const entry of CATALOG) {
    if (!(await exerciseRepo.findOneBy({ name: entry.name }))) {
      await exerciseRepo.save(exerciseRepo.create(entry));
    }
  }
  const catalog = await exerciseRepo.find();
  const byName = (name: string) => {
    const exercise = catalog.find((e) => e.name === name);
    if (!exercise) throw new Error(`Missing exercise ${name}`);
    return exercise;
  };
  const routines = ROUTINES.map((names) => names.map(byName));

  const user = await usersService.create(
    DEMO_EMAIL,
    await hashPassword(DEMO_PASSWORD),
    'Demo',
    'User',
  );

  for (let sessionsAgo = 8; sessionsAgo >= 1; sessionsAgo--) {
    const date = isoDate(daysFromToday(-sessionsAgo * 2));
    const routine = routines[sessionsAgo % routines.length];
    const week = Math.floor((8 - sessionsAgo) / 3);
    const startedAt = new Date(`${date}T18:00:00`);
    const finishedAt = new Date(
      startedAt.getTime() + (55 + (sessionsAgo % 4) * 5) * 60_000,
    );

    await workoutRepo.save(
      workoutRepo.create({
        date,
        user,
        createdAt: startedAt,
        finishedAt,
        exercises: routine.map((exercise, order) =>
          workoutExerciseRepo.create({
            exercise,
            order,
            sets: [1, 2, 3].map((setNumber) =>
              exerciseSetRepo.create({
                setNumber,
                weight: 40 + week * 5 + order * 10,
                reps: 8,
                completed: true,
              }),
            ),
          }),
        ),
      }),
    );
  }

  const plan = await planService.create(user, {
    name: 'Plan hipertrofia Push/Pull/Legs',
    notes: 'Klasyczny split na 3 dni w tygodniu',
  });

  const templateIds: string[] = [];
  for (const [index, name] of TEMPLATE_NAMES.entries()) {
    const template = await templateService.create(user, {
      name,
      planId: plan.id,
    });
    for (const [order, exercise] of routines[index].entries()) {
      await templateService.addExercise(user.id, template.id, {
        exerciseId: exercise.id,
        order,
        targetSets: 4,
        targetReps: 8,
        targetWeight: 60,
        restSeconds: 90,
      });
    }
    templateIds.push(template.id);
  }

  await plannerService.generate(user, {
    from: isoDate(daysFromToday(0)),
    to: isoDate(daysFromToday(21)),
    assignments: [
      { templateId: templateIds[0], dayOfWeek: 1 },
      { templateId: templateIds[1], dayOfWeek: 3 },
      { templateId: templateIds[2], dayOfWeek: 5 },
    ],
  });

  console.log(`Demo account reset: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await app.close();
}

seedDemo().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
