import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import {
  ProjectRepository,
  ProjectSearchResult,
} from '@/project/domain/repositories/project/project.repository';
import { DeleteProjectUseCase } from '../../delete-project.usecase';
import { GetProjectUseCase } from '../../get-project.usecase';
import { SearchProjectUseCase } from '../../search-project.usecase';
import { UpdateProjectUseCase } from '../../update-project.usecase';
import { ArchiveProjectUseCase } from '../../archive-project.usecase';
import { RestoreProjectUseCase } from '../../restore-project.usecase';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174002';

function makeProject(userId = USER_ID) {
  return new ProjectEntity(
    {
      userId,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
    },
    PROJECT_ID,
  );
}

function makeRepository(project: ProjectEntity | null = makeProject()) {
  return {
    repository: {
      findById: jest.fn().mockResolvedValue(project),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProjectRepository>,
  };
}

function makeTechnologyRepository() {
  return {
    findByProjectId: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<ProjectTechnologyRepository>;
}

describe('Project use cases', () => {
  it('returns the project when it belongs to the user', async () => {
    const { repository } = makeRepository();
    const useCase = new GetProjectUseCase(
      repository,
      makeTechnologyRepository(),
    );

    const output = await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(output).toMatchObject({ id: PROJECT_ID, name: 'DevLog' });
  });

  it("does not expose another user's project in a query", async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new GetProjectUseCase(
      repository,
      makeTechnologyRepository(),
    );

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only supplied fields', async () => {
    const project = makeProject();
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectUseCase(repository);

    const output = await useCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
      name: 'Updated DevLog',
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.name).toBe('Updated DevLog');
    expect(output.status).toBe(ProjectStatusEnum.ACTIVE);
  });

  it("does not update another user's project", async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new UpdateProjectUseCase(repository);

    await expect(
      useCase.execute({
        id: PROJECT_ID,
        userId: USER_ID,
        name: 'Unauthorized attempt',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('requires restoring an archived project before updating', async () => {
    const project = makeProject();
    project.archive();
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectUseCase(repository);

    await expect(
      useCase.execute({
        id: PROJECT_ID,
        userId: USER_ID,
        name: 'Unauthorized attempt',
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('updates and clears optional fields through the main use case', async () => {
    const project = makeProject();
    project.update({
      description: 'Current description',
      localPath: '/workspace/devlog',
    });
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectUseCase(repository);

    const output = await useCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
      description: null,
      localPath: null,
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.description).toBeUndefined();
    expect(output.localPath).toBeUndefined();
  });

  it('rejects a project update with no fields', async () => {
    const { repository } = makeRepository();
    const useCase = new UpdateProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('removes the project only when it belongs to the user', async () => {
    const { repository } = makeRepository();
    const useCase = new DeleteProjectUseCase(repository);

    await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(repository.delete.mock.calls[0]?.[0]).toBe(PROJECT_ID);
  });

  it("does not remove another user's project", async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new DeleteProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('requires restoring a project before hard deletion', async () => {
    const project = makeProject();
    project.archive();
    const { repository } = makeRepository(project);
    const useCase = new DeleteProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('archives and restores the authenticated user project', async () => {
    const project = makeProject();
    const { repository } = makeRepository(project);
    const archiveUseCase = new ArchiveProjectUseCase(repository);
    const restoreUseCase = new RestoreProjectUseCase(repository);

    const output = await archiveUseCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.archivedAt).toBeDefined();

    const restoredOutput = await restoreUseCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
    });

    expect(restoredOutput.archivedAt).toBeUndefined();
  });

  it("does not archive another user's project", async () => {
    const project = makeProject(OTHER_USER_ID);
    const { repository } = makeRepository(project);
    const useCase = new ArchiveProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('builds the search filter from the supplied parameters', async () => {
    const archivedAt = new Date('2026-08-01T00:00:00.000Z');
    const repository = {
      search: jest.fn().mockResolvedValue(
        new ProjectSearchResult({
          items: [makeProject()],
          total: 1,
          currentPage: 1,
          perPage: 15,
          filter: { userId: USER_ID },
        }),
      ),
    } as unknown as jest.Mocked<ProjectRepository>;
    const useCase = new SearchProjectUseCase(repository);

    await useCase.execute({
      userId: USER_ID,
      page: 2,
      perPage: 10,
      sort: 'name',
      sortDir: 'desc',
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
      archivedAt,
    });

    expect(repository.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        page: 2,
        perPage: 10,
        sort: 'name',
        sortDir: 'desc',
        filter: {
          userId: USER_ID,
          name: 'DevLog',
          status: ProjectStatusEnum.ACTIVE,
          archivedAt,
        },
      }),
    );
  });
});
