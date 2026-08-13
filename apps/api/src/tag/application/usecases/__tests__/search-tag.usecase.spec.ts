import { TagEntity } from '@/tag/domain/entities/tag.entity';
import {
  TagRepository,
  TagSearchParams,
  TagSearchResult,
} from '@/tag/domain/repositories/tag.repository';
import { SearchTagUseCase } from '../search-tag.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('SearchTagUseCase', () => {
  let repository: jest.Mocked<TagRepository>;
  let useCase: SearchTagUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<TagRepository>;
    useCase = new SearchTagUseCase(repository);
  });

  it('converte a entrada em parâmetros de busca restritos ao usuário', async () => {
    repository.search.mockResolvedValue(
      new TagSearchResult({
        items: [],
        total: 0,
        currentPage: 2,
        perPage: 10,
      }),
    );

    await useCase.execute({
      userId: USER_ID,
      page: 2,
      perPage: 10,
      sort: 'name',
      sortDir: 'desc',
      name: 'NestJS',
    });

    const params = repository.search.mock.calls[0][0];

    expect(params).toBeInstanceOf(TagSearchParams);
    expect(params).toMatchObject({
      page: 2,
      perPage: 10,
      sort: 'name',
      sortDir: 'desc',
      filter: {
        userId: USER_ID,
        name: 'NestJS',
      },
    });
  });

  it('converte o resultado do repositório em uma saída paginada', async () => {
    const tag = new TagEntity(
      {
        userId: USER_ID,
        name: 'NestJS',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      'tag-1',
    );

    repository.search.mockResolvedValue(
      new TagSearchResult({
        items: [tag],
        total: 3,
        currentPage: 2,
        perPage: 1,
      }),
    );

    const output = await useCase.execute({
      userId: USER_ID,
      page: 2,
      perPage: 1,
    });

    expect(output).toEqual({
      items: [
        {
          id: 'tag-1',
          name: 'NestJS',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          updatedAt: new Date('2026-08-01T00:00:00.000Z'),
        },
      ],
      total: 3,
      currentPage: 2,
      lastPage: 3,
      perPage: 1,
    });
  });
});
