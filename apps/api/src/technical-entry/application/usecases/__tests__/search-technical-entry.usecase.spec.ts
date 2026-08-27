import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import {
  TechnicalEntryRepository,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult,
} from '@/technical-entry/domain/repositories/technical-entry.repository';
import { SearchTechnicalEntryUseCase } from '../search-technical-entry.usecase';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/technical-entry-tag.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeProject(userId: string): ProjectEntity {
  return { userId } as ProjectEntity;
}

describe('SearchTechnicalEntryUseCase', () => {
  let repository: jest.Mocked<TechnicalEntryRepository>;
  let technicalEntryTagRepository: jest.Mocked<TechnicalEntryTagRepository>;
  let projectRepository: jest.Mocked<ProjectRepository>;
  let useCase: SearchTechnicalEntryUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
    technicalEntryTagRepository = {
      findTags: jest.fn().mockResolvedValue(new Map()),
    } as unknown as jest.Mocked<TechnicalEntryTagRepository>;
    projectRepository = {
      findById: jest.fn().mockResolvedValue(makeProject(USER_ID)),
    } as unknown as jest.Mocked<ProjectRepository>;
    useCase = new SearchTechnicalEntryUseCase(
      repository,
      technicalEntryTagRepository,
      projectRepository,
    );
  });

  it('converte a entrada em parâmetros de busca', async () => {
    repository.search.mockResolvedValue(
      new TechnicalEntrySearchResult({
        items: [],
        total: 0,
        currentPage: 2,
        perPage: 10,
      }),
    );

    await useCase.execute({
      page: 2,
      perPage: 10,
      sort: 'title',
      sortDir: 'desc',
      userId: USER_ID,
      projectId: PROJECT_ID,
      title: 'NestJS',
      type: TechnicalEntryType.ISSUE,
      status: TechnicalEntryStatus.RESOLVED,
      archivedAt: null,
    });

    const params = repository.search.mock.calls[0][0];

    expect(params).toBeInstanceOf(TechnicalEntrySearchParams);
    expect(params).toMatchObject({
      page: 2,
      perPage: 10,
      sort: 'title',
      sortDir: 'desc',
      filter: {
        userId: USER_ID,
        projectId: PROJECT_ID,
        title: 'NestJS',
        type: TechnicalEntryType.ISSUE,
        status: TechnicalEntryStatus.RESOLVED,
        archivedAt: null,
      },
    });
  });

  it('rejeita filtro de status para entradas do tipo LEARNING', async () => {
    await expect(
      useCase.execute({
        userId: USER_ID,
        type: TechnicalEntryType.LEARNING,
        status: TechnicalEntryStatus.OPEN,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.search.mock.calls).toHaveLength(0);
  });

  it.each([
    ['quando o projeto não existe', null],
    ['quando o projeto pertence a outro usuário', makeProject('other-user-id')],
  ])('rejeita o filtro de projeto %s', async (_description, project) => {
    projectRepository.findById.mockResolvedValue(project);

    await expect(
      useCase.execute({ userId: USER_ID, projectId: PROJECT_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.search).not.toHaveBeenCalled();
  });

  it('converte o resultado do repositório em uma saída paginada', async () => {
    const entry = new TechnicalEntryEntity(
      {
        userId: USER_ID,
        title: 'Paginação no NestJS',
        context: 'Implementando uma busca paginada',
        type: TechnicalEntryType.ISSUE,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      'entry-1',
    );

    repository.search.mockResolvedValue(
      new TechnicalEntrySearchResult({
        items: [entry],
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
        expect.objectContaining({
          id: 'entry-1',
          title: 'Paginação no NestJS',
          status: 'OPEN',
          tags: [],
        }),
      ],
      total: 3,
      currentPage: 2,
      lastPage: 3,
      perPage: 1,
    });
  });

  it('inclui as tags associadas nas entradas', async () => {
    const entry = new TechnicalEntryEntity(
      {
        userId: USER_ID,
        title: 'Tags na busca',
        context: 'Carregando tags associadas',
        type: TechnicalEntryType.LEARNING,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      'entry-1',
    );
    const tag = new TagEntity({ name: 'NestJS', userId: USER_ID }, 'tag-1');

    repository.search.mockResolvedValue(
      new TechnicalEntrySearchResult({
        items: [entry],
        total: 1,
        currentPage: 1,
        perPage: 15,
      }),
    );
    technicalEntryTagRepository.findTags.mockResolvedValue(
      new Map([[entry.id, [tag]]]),
    );

    const output = await useCase.execute({ userId: USER_ID });

    expect(output.items[0].tags).toEqual([
      {
        id: 'tag-1',
        name: 'NestJS',
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
    ]);
  });
});
