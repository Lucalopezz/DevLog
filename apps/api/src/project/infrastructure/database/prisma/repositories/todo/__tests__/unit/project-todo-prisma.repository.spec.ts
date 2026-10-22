import { ProjectTodoPrismaRepository } from '../../project-todo-prisma.repository';
import { ProjectTodoSearchParams } from '@/project/domain/repositories/todo/project-todo.repository';

const projectId = '71ac450c-f334-4d40-bb82-8480d2dd9148';
const sameTime = new Date('2026-01-01T00:00:00.000Z');
const model = (id: string, completedAt: Date | null) => ({
  id,
  projectId,
  title: `Task ${id}`,
  completedAt,
  createdAt: sameTime,
  updatedAt: sameTime,
});

describe('ProjectTodoPrismaRepository', () => {
  it('pages open tasks before completed tasks with a stable id tie-breaker', async () => {
    const open = [
      model('00000000-0000-4000-8000-000000000001', null),
      model('00000000-0000-4000-8000-000000000002', null),
      model('00000000-0000-4000-8000-000000000003', null),
    ];
    const completed = [
      model('00000000-0000-4000-8000-000000000004', new Date()),
      model('00000000-0000-4000-8000-000000000005', new Date()),
    ];
    const prisma = {
      projectTodo: {
        count: jest.fn(({ where }: { where: { completedAt?: null } }) =>
          Promise.resolve(where.completedAt === null ? open.length : 5),
        ),
        findMany: jest.fn(
          ({
            where,
            skip,
            take,
          }: {
            where: { completedAt: null | { not: null } };
            skip: number;
            take: number;
          }) =>
            Promise.resolve(
              (where.completedAt === null ? open : completed).slice(
                skip,
                skip + take,
              ),
            ),
        ),
      },
    };
    const repository = new ProjectTodoPrismaRepository(prisma as never);
    const search = (page: number) =>
      repository.search(
        new ProjectTodoSearchParams({
          page,
          perPage: 2,
          filter: { projectId },
        }),
      );
    const first = await search(1);
    const second = await search(2);
    const third = await search(3);

    expect(
      [first, second, third].flatMap((page) =>
        page.items.map((item) => item.id),
      ),
    ).toEqual([...open, ...completed].map((item) => item.id));
    expect(second).toMatchObject({ total: 5, currentPage: 2, lastPage: 3 });
    expect(second.filter).toEqual({ projectId });
    expect(prisma.projectTodo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId, completedAt: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
    expect(prisma.projectTodo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId, completedAt: { not: null } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('provides the shared repository findAll operation', async () => {
    const records = [model('00000000-0000-4000-8000-000000000001', null)];
    const findMany = jest.fn().mockResolvedValue(records);
    const repository = new ProjectTodoPrismaRepository({
      projectTodo: { findMany },
    } as never);

    const result = await repository.findAll();

    expect(result.map((todo) => todo.id)).toEqual(
      records.map((item) => item.id),
    );
    expect(repository.sortableFields).toEqual(
      expect.arrayContaining(['createdAt', 'title']),
    );
  });

  it('keeps project filtering and open-first ordering when a supported sort is requested', async () => {
    const count = jest.fn().mockResolvedValue(1);
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new ProjectTodoPrismaRepository({
      projectTodo: { count, findMany },
    } as never);

    await repository.search(
      new ProjectTodoSearchParams({
        filter: { projectId },
        sort: 'title',
        sortDir: 'desc',
      }),
    );

    expect(count).toHaveBeenCalledWith({ where: { projectId } });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId, completedAt: null },
        orderBy: [{ title: 'desc' }, { id: 'asc' }],
      }),
    );
  });
});
