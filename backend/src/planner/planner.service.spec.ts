import { NotFoundException } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { User } from 'src/users/user.entity';

describe('PlannerService.generate', () => {
  const user = { id: '1' } as User;
  const push = { id: '31', name: 'Push' };
  const pull = { id: '32', name: 'Pull' };
  const legs = { id: '33', name: 'Legs' };

  let repo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let templateService: { findOne: jest.Mock };
  let service: PlannerService;

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    templateService = {
      findOne: jest.fn((userId: string, id: string) =>
        Promise.resolve([push, pull, legs].find((t) => t.id === id) ?? null),
      ),
    };
    service = new PlannerService(
      repo as any,
      templateService as any,
      {} as any,
    );
  });

  it('schedules each template on its day of the week', async () => {
    const result = await service.generate(user, {
      from: '2026-10-05',
      to: '2026-10-11',
      assignments: [
        { templateId: '31', dayOfWeek: 1 },
        { templateId: '32', dayOfWeek: 3 },
        { templateId: '33', dayOfWeek: 5 },
      ],
    });

    expect(result.map((s) => [s.date, s.template?.name])).toEqual([
      ['2026-10-05', 'Push'],
      ['2026-10-07', 'Pull'],
      ['2026-10-09', 'Legs'],
    ]);
  });

  it('repeats the schedule every week in the range', async () => {
    const result = await service.generate(user, {
      from: '2026-10-05',
      to: '2026-10-25',
      assignments: [{ templateId: '31', dayOfWeek: 1 }],
    });

    expect(result.map((s) => s.date)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ]);
  });

  it('does not overwrite days that already have a scheduled workout', async () => {
    repo.find.mockResolvedValue([{ date: '2026-10-07' }]);

    const result = await service.generate(user, {
      from: '2026-10-05',
      to: '2026-10-11',
      assignments: [
        { templateId: '31', dayOfWeek: 1 },
        { templateId: '32', dayOfWeek: 3 },
      ],
    });

    expect(result.map((s) => s.date)).toEqual(['2026-10-05']);
  });

  it('fails when a template does not belong to the user', async () => {
    await expect(
      service.generate(user, {
        from: '2026-10-05',
        to: '2026-10-11',
        assignments: [{ templateId: '99', dayOfWeek: 1 }],
      }),
    ).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
