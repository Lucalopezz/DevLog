import type { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';
import { SearchProjectTechnologyUseCase } from '../../search-project-technology.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

describe('SearchProjectTechnologyUseCase', () => {
  const item = {
    id: '123e4567-e89b-42d3-a456-426614174020',
    projectId: PROJECT_ID,
    projectName: 'DevLog',
    name: 'TypeScript',
    version: '6',
    createdAt: new Date('2026-10-01T12:00:00Z'),
    updatedAt: new Date('2026-10-01T12:00:00Z'),
  };

  function setup(total: number, items = [item]) {
    const repository = {
      searchForOwner: jest.fn().mockResolvedValue({ items, total }),
    } as unknown as jest.Mocked<ProjectTechnologyRepository>;
    return {
      repository,
      useCase: new SearchProjectTechnologyUseCase(repository),
    };
  }

  it('always scopes the search to the owner and applies pagination defaults', async () => {
    const { repository, useCase } = setup(31);

    const output = await useCase.execute({ userId: USER_ID });

    expect(repository.searchForOwner.mock.calls).toEqual([
      [
        {
          userId: USER_ID,
          name: undefined,
          projectId: undefined,
          page: 1,
          perPage: 15,
        },
      ],
    ]);
    expect(output).toEqual({
      items: [item],
      total: 31,
      currentPage: 1,
      perPage: 15,
      lastPage: 3,
    });
  });

  it('forwards both filters and uses the total rather than the page length', async () => {
    const { repository, useCase } = setup(21);
    const input = {
      userId: USER_ID,
      projectId: PROJECT_ID,
      name: 'script',
      page: 3,
      perPage: 10,
    };

    const output = await useCase.execute(input);

    expect(repository.searchForOwner.mock.calls).toEqual([[input]]);
    expect(output).toMatchObject({
      total: 21,
      currentPage: 3,
      perPage: 10,
      lastPage: 3,
    });
    expect(output.items).toEqual([item]);
  });

  it('returns an empty collection with zero pages when no technology matches', async () => {
    const { useCase } = setup(0, []);
    await expect(useCase.execute({ userId: USER_ID })).resolves.toEqual({
      items: [],
      total: 0,
      currentPage: 1,
      perPage: 15,
      lastPage: 0,
    });
  });

  it('propagates a repository failure instead of presenting an empty collection', async () => {
    const { repository, useCase } = setup(0);
    const error = new Error('Database unavailable');
    repository.searchForOwner.mockRejectedValue(error);

    await expect(useCase.execute({ userId: USER_ID })).rejects.toBe(error);
  });
});
