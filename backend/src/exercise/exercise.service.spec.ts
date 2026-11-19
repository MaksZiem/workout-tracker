import { BadGatewayException, ConflictException } from '@nestjs/common';
import { ExerciseService } from './exercise.service';

const catalog = [
  { id: 1, name: 'Podciąganie', muscleGroup: 'BACK', substitutesGeneratedAt: new Date() },
  { id: 2, name: 'Ściąganie drążka', muscleGroup: 'BACK', substitutesGeneratedAt: null },
  { id: 3, name: 'Wiosłowanie', muscleGroup: 'BACK', substitutesGeneratedAt: null },
  { id: 4, name: 'Pullover', muscleGroup: 'BACK', substitutesGeneratedAt: null },
  { id: 5, name: 'Face pull', muscleGroup: 'BACK', substitutesGeneratedAt: null },
  { id: 6, name: 'Szrugsy', muscleGroup: 'BACK', substitutesGeneratedAt: null },
  { id: 7, name: 'Martwy ciąg', muscleGroup: 'BACK', substitutesGeneratedAt: null },
];

describe('ExerciseService substitutes', () => {
  let manager: {
    transaction: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let repo: { find: jest.Mock; findOneBy: jest.Mock; remove: jest.Mock; manager: typeof manager };
  let substitutes: { find: jest.Mock };
  let gemini: { generateJson: jest.Mock };
  let service: ExerciseService;

  function savedSubstitutes() {
    return manager.save.mock.calls.at(-1)[0] as {
      exercise: { id: number };
      substitute: { id: number };
      reason: string;
      rank: number;
    }[];
  }

  beforeEach(() => {
    manager = {
      transaction: jest.fn((work) => work(manager)),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn((_entity, data) => data),
      update: jest.fn(),
    };
    repo = {
      find: jest.fn().mockResolvedValue(catalog),
      findOneBy: jest.fn(({ id }) =>
        Promise.resolve(catalog.find((e) => e.id === id) ?? null),
      ),
      remove: jest.fn(),
      manager,
    };
    substitutes = { find: jest.fn().mockResolvedValue([]) };
    gemini = { generateJson: jest.fn() };
    service = new ExerciseService(repo as any, substitutes as any, gemini as any);
  });

  describe('generateSubstitutes', () => {
    it('saves the picked substitutes ranked from the best', async () => {
      gemini.generateJson.mockResolvedValue({
        results: [
          {
            exerciseId: 1,
            substitutes: [
              { exerciseId: 2, reason: 'Same vertical pull' },
              { exerciseId: 3, reason: 'Back, but a horizontal pull' },
            ],
          },
        ],
      });

      await service.generateSubstitutes(1);

      expect(savedSubstitutes()).toEqual([
        { exercise: { id: 1 }, substitute: { id: 2 }, reason: 'Same vertical pull', rank: 0 },
        { exercise: { id: 1 }, substitute: { id: 3 }, reason: 'Back, but a horizontal pull', rank: 1 },
      ]);
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), 1, {
        substitutesGeneratedAt: expect.any(Date),
      });
    });

    it('drops unknown ids, the exercise itself and duplicates', async () => {
      gemini.generateJson.mockResolvedValue({
        results: [
          {
            exerciseId: 1,
            substitutes: [
              { exerciseId: 999, reason: 'Invented' },
              { exerciseId: 1, reason: 'Itself' },
              { exerciseId: 2, reason: 'Good' },
              { exerciseId: 2, reason: 'Duplicate' },
            ],
          },
        ],
      });

      await service.generateSubstitutes(1);

      expect(savedSubstitutes().map((s) => s.substitute.id)).toEqual([2]);
    });

    it('keeps at most 5 substitutes', async () => {
      gemini.generateJson.mockResolvedValue({
        results: [
          {
            exerciseId: 1,
            substitutes: [2, 3, 4, 5, 6, 7].map((id) => ({ exerciseId: id, reason: 'ok' })),
          },
        ],
      });

      await service.generateSubstitutes(1);

      expect(savedSubstitutes().map((s) => s.substitute.id)).toEqual([2, 3, 4, 5, 6]);
    });

    it('trims the reason and cuts it to 200 characters', async () => {
      gemini.generateJson.mockResolvedValue({
        results: [
          {
            exerciseId: 1,
            substitutes: [{ exerciseId: 2, reason: `  ${'x'.repeat(250)}  ` }],
          },
        ],
      });

      await service.generateSubstitutes(1);

      expect(savedSubstitutes()[0].reason).toBe('x'.repeat(200));
    });

    it('returns 502 with AI_UNAVAILABLE when Gemini fails', async () => {
      gemini.generateJson.mockRejectedValue(new Error('boom'));

      await expect(service.generateSubstitutes(1)).rejects.toThrow(
        BadGatewayException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('generateAllSubstitutes', () => {
    it('only processes exercises without substitutes when asked', async () => {
      gemini.generateJson.mockResolvedValue({ results: [] });

      const result = await service.generateAllSubstitutes(true);

      const prompt: string = gemini.generateJson.mock.calls[0][0];
      const targets = prompt.split('Katalog (id')[0].split('Ćwiczenia (id')[1];
      expect(targets).not.toContain('1 | Podciąganie');
      expect(targets).toContain('2 | Ściąganie drążka');
      expect(result).toEqual({ updated: 6, failed: [] });
    });

    it('reports the exercises that failed instead of stopping', async () => {
      gemini.generateJson.mockRejectedValue(new Error('boom'));

      const result = await service.generateAllSubstitutes(false);

      expect(result.updated).toBe(0);
      expect(result.failed).toEqual(catalog.map((e) => e.name));
    });
  });

  it('create still saves the exercise when Gemini is down', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
    };
    Object.assign(repo, {
      createQueryBuilder: jest.fn(() => query),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
    });
    gemini.generateJson.mockRejectedValue(new Error('boom'));

    const created = await service.create({ name: 'Podciąganie', muscleGroup: 'BACK' } as any);

    expect(created.id).toBe(1);
  });

  it('refuses to create an exercise with a name that is already taken', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(true),
    };
    Object.assign(repo, {
      createQueryBuilder: jest.fn(() => query),
      save: jest.fn(),
    });

    await expect(
      service.create({ name: ' podciąganie ', muscleGroup: 'BACK' } as any),
    ).rejects.toThrow(ConflictException);
    expect(query.where).toHaveBeenCalledWith('LOWER(e.name) = LOWER(:name)', {
      name: 'podciąganie',
    });
  });
});
