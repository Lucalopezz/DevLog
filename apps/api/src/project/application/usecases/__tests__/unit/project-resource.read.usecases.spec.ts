import { NotFoundException } from '@nestjs/common';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/project-resource.entity';
import {
  ProjectResourceRepository,
  ProjectResourceSearchResult,
} from '@/project/domain/repositories/project-resource.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { GetProjectResourceUseCase } from '../../get-project-resource.usecase';
import { SearchProjectResourceUseCase } from '../../search-project-resource.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174002';
const OTHER_PROJECT_ID = '123e4567-e89b-42d3-a456-426614174003';
const RESOURCE_ID = '123e4567-e89b-42d3-a456-426614174004';

function makeProject(userId = USER_ID, projectId = PROJECT_ID): ProjectEntity {
  return new ProjectEntity(
    {
      userId,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
    },
    projectId,
  );
}

function makeResource(projectId = PROJECT_ID): ProjectResourceEntity {
  return new ProjectResourceEntity(
    {
      projectId,
      label: 'Documentação da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    },
    RESOURCE_ID,
  );
}

describe('SearchProjectResourceUseCase', () => {
  it('busca recursos somente dentro do projeto autorizado', async () => {
    const project = makeProject();
    const resource = makeResource();
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectResourceRepository = {
      search: jest.fn().mockResolvedValue(
        new ProjectResourceSearchResult({
          items: [resource],
          total: 1,
          currentPage: 2,
          perPage: 10,
          sort: 'label',
          sortDir: 'asc',
          filter: {
            projectId: PROJECT_ID,
            label: 'documentação',
            type: ProjectResourceType.DOCUMENTATION,
          },
        }),
      ),
    } as unknown as jest.Mocked<ProjectResourceRepository>;
    const useCase = new SearchProjectResourceUseCase(
      projectRepository,
      projectResourceRepository,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      page: 2,
      perPage: 10,
      sort: 'label',
      sortDir: 'asc',
      label: 'documentação',
      url: 'docs.example.com',
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(projectResourceRepository.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        page: 2,
        perPage: 10,
        sort: 'label',
        sortDir: 'asc',
        filter: {
          projectId: PROJECT_ID,
          label: 'documentação',
          url: 'docs.example.com',
          type: ProjectResourceType.DOCUMENTATION,
        },
      }),
    );
    expect(output).toMatchObject({
      items: [
        expect.objectContaining({
          id: RESOURCE_ID,
          projectId: PROJECT_ID,
          label: 'Documentação da API',
        }),
      ],
      total: 1,
      currentPage: 2,
      perPage: 10,
      lastPage: 1,
    });
  });

  it('não busca recursos de projeto de outro usuário', async () => {
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(makeProject(OTHER_USER_ID)),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectResourceRepository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<ProjectResourceRepository>;
    const useCase = new SearchProjectResourceUseCase(
      projectRepository,
      projectResourceRepository,
    );

    await expect(
      useCase.execute({ userId: USER_ID, projectId: PROJECT_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.search.mock.calls).toHaveLength(0);
  });
});

describe('GetProjectResourceUseCase', () => {
  function makeUseCase(
    project: ProjectEntity | null = makeProject(),
    resource: ProjectResourceEntity | null = makeResource(),
  ) {
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectResourceRepository = {
      findById: jest.fn().mockResolvedValue(resource),
    } as unknown as jest.Mocked<ProjectResourceRepository>;

    return {
      useCase: new GetProjectResourceUseCase(
        projectRepository,
        projectResourceRepository,
      ),
      projectResourceRepository,
    };
  }

  it('retorna o recurso quando ele pertence ao projeto do usuário', async () => {
    const { useCase } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      resourceId: RESOURCE_ID,
    });

    expect(output).toMatchObject({
      id: RESOURCE_ID,
      projectId: PROJECT_ID,
      label: 'Documentação da API',
      type: ProjectResourceType.DOCUMENTATION,
    });
  });

  it('não retorna recurso de projeto de outro usuário', async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.findById.mock.calls).toHaveLength(0);
  });

  it('não retorna recurso que pertence a outro projeto', async () => {
    const { useCase } = makeUseCase(
      makeProject(),
      makeResource(OTHER_PROJECT_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna erro quando o recurso não existe', async () => {
    const { useCase } = makeUseCase(makeProject(), null);

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
