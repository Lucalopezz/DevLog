import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { NotFoundException } from '@nestjs/common';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceRepository } from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { AddProjectResourceUseCase } from '../../add-project-resource.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174002';

function makeProject(userId = USER_ID): ProjectEntity {
  return new ProjectEntity(
    {
      userId,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
    },
    PROJECT_ID,
  );
}

function makeUseCase(project: ProjectEntity | null = makeProject()) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectResourceRepository = {
    insert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectResourceRepository>;

  return {
    useCase: new AddProjectResourceUseCase(
      projectRepository,
      projectResourceRepository,
    ),
    projectResourceRepository,
  };
}

describe('AddProjectResourceUseCase', () => {
  it('creates and returns a project resource', async () => {
    const { useCase, projectResourceRepository } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(projectResourceRepository.insert.mock.calls).toHaveLength(1);
    expect(projectResourceRepository.insert.mock.calls[0]?.[0]).toMatchObject({
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });
    expect(output).toMatchObject({
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      type: ProjectResourceType.DOCUMENTATION,
    });
  });

  it('uses OTHER when the type is omitted', async () => {
    const { useCase } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      label: 'Figma',
      url: 'https://figma.com/file/devlog',
    });

    expect(output.type).toBe(ProjectResourceType.OTHER);
  });

  it('does not create a resource with an invalid URL', async () => {
    const { useCase, projectResourceRepository } = makeUseCase();

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        label: 'Invalid URL',
        url: 'not-a-url',
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);

    expect(projectResourceRepository.insert.mock.calls).toHaveLength(0);
  });

  it("does not create a resource for another user's project", async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        label: 'Resource indevido',
        url: 'https://example.com/unsafe',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.insert.mock.calls).toHaveLength(0);
  });
});
