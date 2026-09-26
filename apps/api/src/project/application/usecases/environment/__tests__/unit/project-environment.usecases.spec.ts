import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { UpdateProjectEnvironmentUseCase } from '../../update-project-environment.usecase';
import { RemoveProjectEnvironmentUseCase } from '../../remove-project-environment.usecase';
import { SearchProjectEnvironmentUseCase } from '../../search-project-environment.usecase';
import { SearchOwnerProjectEnvironmentsUseCase } from '../../search-owner-project-environments.usecase';
import {
  ProjectEnvironmentSearchParams,
  ProjectEnvironmentSearchResult,
} from '@/project/domain/repositories/environment/project-environment.repository';

const userId = '123e4567-e89b-42d3-a456-426614174000';
const projectId = '123e4567-e89b-42d3-a456-426614174002';
const environmentId = '123e4567-e89b-42d3-a456-426614174003';
function setup(archived = false, environmentProjectId = projectId) {
  const project = new ProjectEntity(
    {
      userId,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
      archivedAt: archived ? new Date() : undefined,
    },
    projectId,
  );
  const environment = new ProjectEnvironmentEntity(
    {
      projectId: environmentProjectId,
      name: 'Local',
      category: ProjectEnvironmentCategory.LOCAL,
      runtime: 'Node.js',
    },
    environmentId,
  );
  const projects = {
    findById: jest.fn().mockResolvedValue(project),
    findByOwnerId: jest.fn().mockResolvedValue([project]),
  };
  const environments = {
    findById: jest.fn().mockResolvedValue(environment),
    findByNormalizedName: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn().mockResolvedValue(
      new ProjectEnvironmentSearchResult({
        items: [environment],
        total: 1,
        currentPage: 1,
        perPage: 6,
      }),
    ),
  };
  return { projects, environments, environment };
}

describe('project environment use cases', () => {
  it('updates supplied fields, clears null, and preserves omissions', async () => {
    const { projects, environments } = setup();
    const result = await new UpdateProjectEnvironmentUseCase(
      projects as never,
      environments as never,
    ).execute({
      userId,
      projectId,
      environmentId,
      name: ' Testing ',
      runtime: null,
    });
    expect(result).toMatchObject({
      name: 'Testing',
      runtime: null,
      category: 'LOCAL',
      projectName: 'DevLog',
    });
    expect(environments.findByNormalizedName).toHaveBeenCalledWith(
      projectId,
      'testing',
    );
    expect(environments.update).toHaveBeenCalledTimes(1);
  });
  it('rejects empty updates and duplicate normalized names', async () => {
    const { projects, environments } = setup();
    const useCase = new UpdateProjectEnvironmentUseCase(
      projects as never,
      environments as never,
    );
    await expect(
      useCase.execute({ userId, projectId, environmentId }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    environments.findByNormalizedName.mockResolvedValue({ id: 'other' });
    await expect(
      useCase.execute({ userId, projectId, environmentId, name: 'Duplicated' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects records addressed through a different project and archived mutations', async () => {
    const mismatched = setup(false, '123e4567-e89b-42d3-a456-426614174004');
    await expect(
      new RemoveProjectEnvironmentUseCase(
        mismatched.projects as never,
        mismatched.environments as never,
      ).execute({ userId, projectId, environmentId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    const archived = setup(true);
    await expect(
      new UpdateProjectEnvironmentUseCase(
        archived.projects as never,
        archived.environments as never,
      ).execute({ userId, projectId, environmentId, name: 'Changed' }),
    ).rejects.toThrow();
    expect(archived.environments.update).not.toHaveBeenCalled();
  });
  it('removes only a matching environment', async () => {
    const { projects, environments } = setup();
    await new RemoveProjectEnvironmentUseCase(
      projects as never,
      environments as never,
    ).execute({ userId, projectId, environmentId });
    expect(environments.delete).toHaveBeenCalledWith(environmentId);
  });
  it('lists an owned project and includes its name in each item', async () => {
    const { projects, environments } = setup();
    const result = await new SearchProjectEnvironmentUseCase(
      projects as never,
      environments as never,
    ).execute({ userId, projectId, page: 1 });
    expect(result.items[0]).toMatchObject({
      projectName: 'DevLog',
      name: 'Local',
    });
    expect(result.total).toBe(1);
  });
  it('passes the authenticated owner and filters to the global repository search', async () => {
    const { projects, environments } = setup();
    environments.search.mockResolvedValue(
      new ProjectEnvironmentSearchResult({
        items: [],
        total: 0,
        currentPage: 2,
        perPage: 5,
      }),
    );
    const result = await new SearchOwnerProjectEnvironmentsUseCase(
      projects as never,
      environments as never,
    ).execute({
      userId,
      search: 'Node',
      category: ProjectEnvironmentCategory.LOCAL,
      projectId,
      page: 2,
      perPage: 5,
    });
    expect(environments.search).toHaveBeenCalledWith(
      new ProjectEnvironmentSearchParams({
        filter: {
          userId,
          search: 'Node',
          category: ProjectEnvironmentCategory.LOCAL,
          projectId,
        },
        page: 2,
        perPage: 5,
      }),
    );
    expect(result).toMatchObject({
      currentPage: 2,
      perPage: 5,
      total: 0,
      lastPage: 0,
    });
    expect(projects.findByOwnerId).not.toHaveBeenCalled();
  });

  it('maps global search entities to output items with their project names', async () => {
    const { projects, environments, environment } = setup();
    environments.search.mockResolvedValue(
      new ProjectEnvironmentSearchResult({
        items: [environment],
        total: 1,
        currentPage: 1,
        perPage: 15,
      }),
    );
    const result = await new SearchOwnerProjectEnvironmentsUseCase(
      projects as never,
      environments as never,
    ).execute({ userId });
    expect(projects.findByOwnerId).toHaveBeenCalledWith(userId);
    expect(result.items[0]).toMatchObject({
      id: environmentId,
      projectName: 'DevLog',
      name: 'Local',
      runtime: 'Node.js',
    });
  });

  it('rejects a global search without an authenticated owner', async () => {
    const { projects, environments } = setup();
    await expect(
      new SearchOwnerProjectEnvironmentsUseCase(
        projects as never,
        environments as never,
      ).execute({ userId: '' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(environments.search).not.toHaveBeenCalled();
  });
});
