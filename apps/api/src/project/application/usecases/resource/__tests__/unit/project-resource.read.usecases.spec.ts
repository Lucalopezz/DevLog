import { NotFoundException } from '@nestjs/common';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';
import {
  ProjectResourceRepository,
  ProjectResourceSearchResult,
} from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
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
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    },
    RESOURCE_ID,
  );
}

describe('SearchProjectResourceUseCase', () => {
  it('searches resources only within the authorized project', async () => {
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
            label: 'documentation',
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
      label: 'documentation',
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
          label: 'documentation',
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
          label: 'Documentation da API',
        }),
      ],
      total: 1,
      currentPage: 2,
      perPage: 10,
      lastPage: 1,
    });
  });

  it("does not search resources in another user's project", async () => {
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

  it('returns the resource when it belongs to the user project', async () => {
    const { useCase } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      resourceId: RESOURCE_ID,
    });

    expect(output).toMatchObject({
      id: RESOURCE_ID,
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      type: ProjectResourceType.DOCUMENTATION,
    });
  });

  it("does not return a resource in another user's project", async () => {
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

  it('does not return a resource belonging to another project', async () => {
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

  it('returns an error when the resource does not exist', async () => {
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
