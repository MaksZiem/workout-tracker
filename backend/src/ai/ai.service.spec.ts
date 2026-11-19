import { NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { User } from 'src/users/user.entity';
import { TrainingGoal } from 'src/enums/training-goal.enum';

describe('AiService', () => {
  const user = { id: 1 } as User;
  const catalog = [
    { id: 1, name: 'Wyciskanie sztangi leżąc', muscleGroup: 'CHEST' },
    { id: 2, name: 'Podciąganie', muscleGroup: 'BACK' },
  ];

  let gemini: { generateJson: jest.Mock };
  let exerciseService: { findAll: jest.Mock };
  let templateService: {
    create: jest.Mock;
    addExercise: jest.Mock;
    findOne: jest.Mock;
  };
  let planService: { create: jest.Mock };
  let workoutService: {
    findOne: jest.Mock;
    addExercise: jest.Mock;
    addSet: jest.Mock;
  };
  let service: AiService;

  beforeEach(() => {
    gemini = { generateJson: jest.fn() };
    exerciseService = { findAll: jest.fn().mockResolvedValue(catalog) };
    templateService = {
      create: jest.fn().mockResolvedValue({ id: 100 }),
      addExercise: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 100 }),
    };
    planService = { create: jest.fn().mockResolvedValue({ id: 50 }) };
    workoutService = {
      findOne: jest.fn().mockResolvedValue({ id: 7, exercises: [{}, {}] }),
      addExercise: jest.fn().mockResolvedValue({ id: 70 }),
      addSet: jest.fn(),
    };
    service = new AiService(
      gemini as any,
      exerciseService as any,
      templateService as any,
      planService as any,
      workoutService as any,
    );
  });

  describe('parseWorkout', () => {
    it('adds parsed exercises after the existing ones, with numbered sets', async () => {
      gemini.generateJson.mockResolvedValue({
        exercises: [
          {
            exerciseId: 1,
            sets: [
              { reps: 8, weight: 80 },
              { reps: 8, weight: 80 },
            ],
          },
        ],
      });

      await service.parseWorkout(user, { workoutId: 7, text: 'bench 2x8 80' });

      expect(workoutService.addExercise).toHaveBeenCalledWith(1, 7, {
        exerciseId: 1,
        order: 2,
      });
      expect(workoutService.addSet).toHaveBeenNthCalledWith(1, 1, 7, 70, {
        setNumber: 1,
        reps: 8,
        weight: 80,
        completed: true,
      });
      expect(workoutService.addSet).toHaveBeenNthCalledWith(2, 1, 7, 70, {
        setNumber: 2,
        reps: 8,
        weight: 80,
        completed: true,
      });
    });

    it('skips exercises that are not in the catalog', async () => {
      gemini.generateJson.mockResolvedValue({
        exercises: [
          { exerciseId: 999, sets: [{ reps: 10, weight: 20 }] },
          { exerciseId: 2, sets: [{ reps: 10, weight: 0 }] },
        ],
      });

      await service.parseWorkout(user, { workoutId: 7, text: 'pull-ups 1x10' });

      expect(workoutService.addExercise).toHaveBeenCalledTimes(1);
      expect(workoutService.addExercise).toHaveBeenCalledWith(1, 7, {
        exerciseId: 2,
        order: 2,
      });
      expect(workoutService.addSet).toHaveBeenCalledTimes(1);
    });

    it('fails before calling the AI when the workout does not exist', async () => {
      workoutService.findOne.mockResolvedValue(null);

      await expect(
        service.parseWorkout(user, { workoutId: 7, text: 'bench 3x8' }),
      ).rejects.toThrow(NotFoundException);
      expect(gemini.generateJson).not.toHaveBeenCalled();
    });

    it('sends the exercise catalog to the model', async () => {
      gemini.generateJson.mockResolvedValue({ exercises: [] });

      await service.parseWorkout(user, { workoutId: 7, text: 'bench 3x8' });

      const prompt: string = gemini.generateJson.mock.calls[0][0];
      expect(prompt).toContain('id:1 Wyciskanie sztangi leżąc (CHEST)');
      expect(prompt).toContain('id:2 Podciąganie (BACK)');
    });
  });

  describe('generatePlan', () => {
    it('creates a plan with one template per generated day and drops unknown exercises', async () => {
      gemini.generateJson.mockResolvedValue({
        templates: [
          {
            name: 'Push',
            exercises: [
              { exerciseId: 1, order: 0, targetSets: 4, targetReps: 10 },
              { exerciseId: 999, order: 1, targetSets: 3, targetReps: 12 },
            ],
          },
          {
            name: 'Pull',
            exercises: [
              { exerciseId: 2, order: 0, targetSets: 4, targetReps: 8 },
            ],
          },
        ],
      });

      const result = await service.generatePlan(user, {
        goal: TrainingGoal.HYPERTROPHY,
        daysPerWeek: 2,
        language: 'en',
      });

      expect(planService.create).toHaveBeenCalledWith(user, {
        name: 'Plan: Hypertrophy — 2x/week',
        notes: undefined,
      });
      expect(templateService.create).toHaveBeenCalledTimes(2);
      expect(templateService.addExercise).toHaveBeenCalledTimes(2);
      expect(
        templateService.addExercise.mock.calls.map((call) => call[2].exerciseId),
      ).toEqual([1, 2]);
      expect(result.templates).toHaveLength(2);
    });
  });
});
