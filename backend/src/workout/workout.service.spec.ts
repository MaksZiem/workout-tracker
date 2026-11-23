import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { User } from 'src/users/user.entity';
import { WorkoutTemplate } from 'src/template/workout-template.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

describe('WorkoutService', () => {
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let workoutExerciseRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let exerciseSetRepo: { create: jest.Mock; save: jest.Mock };
  let scheduledRepo: { update: jest.Mock };
  let exerciseService: { findOne: jest.Mock };
  let service: WorkoutService;

  beforeEach(() => {
    const passThrough = () => ({
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve(data)),
    });
    repo = {
      ...passThrough(),
      findOne: jest.fn(),
      remove: jest.fn((data) => Promise.resolve(data)),
    };
    workoutExerciseRepo = { ...passThrough(), findOne: jest.fn() };
    exerciseSetRepo = passThrough();
    scheduledRepo = { update: jest.fn() };
    exerciseService = { findOne: jest.fn() };
    service = new WorkoutService(
      repo as any,
      workoutExerciseRepo as any,
      exerciseSetRepo as any,
      scheduledRepo as any,
      exerciseService as any,
    );
  });

  describe('finish', () => {
    it('sets finishedAt and marks the scheduled session as completed', async () => {
      repo.findOne.mockResolvedValue({ id: '7', finishedAt: null });

      const workout = await service.finish('1', '7');

      expect(workout.finishedAt).toBeInstanceOf(Date);
      expect(scheduledRepo.update).toHaveBeenCalledWith(
        { workout: { id: '7' }, user: { id: '1' } },
        { status: ScheduledWorkoutStatus.COMPLETED },
      );
    });

    it('keeps the original finish time when finished twice', async () => {
      const finishedAt = new Date('2026-10-05T18:00:00Z');
      repo.findOne.mockResolvedValue({ id: '7', finishedAt });

      const workout = await service.finish('1', '7');

      expect(workout.finishedAt).toBe(finishedAt);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("returns 404 for someone else's workout", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.finish('1', '7')).rejects.toThrow(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: '7', user: { id: '1' } },
      });
    });
  });

  describe('cancel', () => {
    it('refuses to cancel a finished workout', async () => {
      repo.findOne.mockResolvedValue({ id: '7', finishedAt: new Date() });

      await expect(service.cancel('1', '7')).rejects.toThrow(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('deletes an unfinished workout and puts its scheduled session back to planned', async () => {
      repo.findOne.mockResolvedValue({ id: '7', finishedAt: null });

      const result = await service.cancel('1', '7');

      expect(result).toEqual({ cancelled: true });
      expect(repo.remove).toHaveBeenCalled();
      expect(scheduledRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ workout: { id: '7' }, user: { id: '1' } }),
        { status: ScheduledWorkoutStatus.PLANNED },
      );
    });
  });

  describe('duplicateWorkout', () => {
    it('copies exercises and sets for today, with every set unticked', async () => {
      repo.findOne.mockResolvedValue({
        id: '7',
        notes: 'Push day',
        exercises: [
          {
            exercise: { id: '1' },
            order: 0,
            sets: [
              {
                setNumber: 1,
                weight: 80,
                reps: 8,
                restSeconds: 90,
                completed: true,
              },
              {
                setNumber: 2,
                weight: 80,
                reps: 7,
                restSeconds: 90,
                completed: true,
              },
            ],
          },
        ],
      });

      const copy = await service.duplicateWorkout('1', '7');

      expect(copy.date).toBe(new Date().toISOString().slice(0, 10));
      expect(copy.notes).toBe('Push day');
      expect(copy.exercises[0].sets).toEqual([
        {
          setNumber: 1,
          weight: 80,
          reps: 8,
          restSeconds: 90,
          completed: false,
        },
        {
          setNumber: 2,
          weight: 80,
          reps: 7,
          restSeconds: 90,
          completed: false,
        },
      ]);
    });

    it('returns 404 when the workout does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.duplicateWorkout('1', '7')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createFromTemplate', () => {
    it('pre-fills one set per target set with the target reps and weight', async () => {
      const template = {
        exercises: [
          {
            exercise: { id: '1' },
            order: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 60,
            restSeconds: 90,
          },
        ],
      } as unknown as WorkoutTemplate;

      const workout = await service.createFromTemplate(
        { id: '1' } as User,
        template,
        '2026-10-05',
      );

      expect(workout.date).toBe('2026-10-05');
      expect(workout.exercises[0].sets.map((s) => s.setNumber)).toEqual([
        1, 2, 3,
      ]);
      expect(workout.exercises[0].sets[0]).toMatchObject({
        weight: 60,
        reps: 10,
        completed: false,
      });
    });

    it('uses 0 kg when the template has no target weight', async () => {
      const template = {
        exercises: [
          { exercise: { id: '2' }, order: 0, targetSets: 1, targetReps: 12 },
        ],
      } as unknown as WorkoutTemplate;

      const workout = await service.createFromTemplate(
        { id: '1' } as User,
        template,
        '2026-10-05',
      );

      expect(workout.exercises[0].sets[0].weight).toBe(0);
    });
  });

  describe('addExercise', () => {
    it('returns 404 when the exercise is not in the catalog', async () => {
      repo.findOne.mockResolvedValue({ id: '7' });
      exerciseService.findOne.mockResolvedValue(null);

      await expect(
        service.addExercise('1', '7', { exerciseId: '999', order: 0 }),
      ).rejects.toThrow(NotFoundException);
      expect(workoutExerciseRepo.save).not.toHaveBeenCalled();
    });

    it('adds the exercise to the workout in the given order', async () => {
      repo.findOne.mockResolvedValue({ id: '7' });
      exerciseService.findOne.mockResolvedValue({
        id: '1',
        name: 'Bench press',
      });

      const we = await service.addExercise('1', '7', {
        exerciseId: '1',
        order: 2,
      });

      expect(we).toMatchObject({
        workout: { id: '7' },
        exercise: { id: '1' },
        order: 2,
      });
    });
  });

  it("addSet returns 404 for an exercise from someone else's workout", async () => {
    workoutExerciseRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addSet('1', '7', '70', { setNumber: 1, reps: 8, weight: 80 }),
    ).rejects.toThrow(NotFoundException);
    expect(workoutExerciseRepo.findOne).toHaveBeenCalledWith({
      where: { id: '70', workout: { id: '7', user: { id: '1' } } },
    });
  });
});
