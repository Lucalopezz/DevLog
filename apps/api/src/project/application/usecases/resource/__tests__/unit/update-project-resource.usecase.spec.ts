import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';
import { ProjectResourceRepository } from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UpdateProjectResourceUseCase } from '../../update-project-resource.usecase';

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
      label: 'Repository principal',
      url: 'https://github.com/example/devlog',
      type: ProjectResourceType.REPOSITORY,
    },
    RESOURCE_ID,
  );
}

function makeUseCase(
  project: ProjectEntity | null = makeProject(),
  resource: ProjectResourceEntity | null = makeResource(),
) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectResourceRepository = {
    findById: jest.fn().mockResolvedValue(resource),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectResourceRepository>;

  return {
    useCase: new UpdateProjectResourceUseCase(
      projectRepository,
      projectResourceRepository,
    ),
    projectResourceRepository,
  };
}

describe('UpdateProjectResourceUseCase', () => {
  it('updates supplied fields and persists the resource', async () => {
    const resource = makeResource();
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(),
      resource,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      resourceId: RESOURCE_ID,
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(projectResourceRepository.update.mock.calls[0]?.[0]).toBe(resource);
    expect(output).toMatchObject({
      id: RESOURCE_ID,
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });
  });

  it('does not persist an invalid URL', async () => {
    const { useCase, projectResourceRepository } = makeUseCase();

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
        url: 'not-a-url',
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);

    expect(projectResourceRepository.update.mock.calls).toHaveLength(0);
  });

  it('rejects an update with no fields', async () => {
    const { useCase, projectResourceRepository } = makeUseCase();

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(projectResourceRepository.update.mock.calls).toHaveLength(0);
  });

  it("does not update a resource in another user's project", async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
        label: 'Resource indevido',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.findById.mock.calls).toHaveLength(0);
    expect(projectResourceRepository.update.mock.calls).toHaveLength(0);
  });

  it('does not update a resource belonging to another project', async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(),
      makeResource(OTHER_PROJECT_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
        label: 'Resource indevido',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.update.mock.calls).toHaveLength(0);
  });

  it('returns an error when the resource does not exist', async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(),
      null,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
        label: 'New label',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.update.mock.calls).toHaveLength(0);
  });
});
