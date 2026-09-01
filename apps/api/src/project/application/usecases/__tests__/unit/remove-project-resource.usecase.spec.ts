import { NotFoundException } from '@nestjs/common';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/project-resource.entity';
import { ProjectResourceRepository } from '@/project/domain/repositories/project-resource.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { RemoveProjectResourceUseCase } from '../../remove-project-resource.usecase';

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
      label: 'Repositório principal',
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
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectResourceRepository>;

  return {
    useCase: new RemoveProjectResourceUseCase(
      projectRepository,
      projectResourceRepository,
    ),
    projectResourceRepository,
  };
}

describe('RemoveProjectResourceUseCase', () => {
  it('remove o recurso do projeto do usuário autenticado', async () => {
    const { useCase, projectResourceRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      resourceId: RESOURCE_ID,
    });

    expect(projectResourceRepository.delete.mock.calls[0]?.[0]).toBe(
      RESOURCE_ID,
    );
  });

  it('não remove recurso de projeto de outro usuário', async () => {
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
    expect(projectResourceRepository.delete.mock.calls).toHaveLength(0);
  });

  it('não remove recurso que pertence a outro projeto', async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
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

    expect(projectResourceRepository.delete.mock.calls).toHaveLength(0);
  });

  it('retorna erro quando o recurso não existe', async () => {
    const { useCase, projectResourceRepository } = makeUseCase(
      makeProject(),
      null,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        resourceId: RESOURCE_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectResourceRepository.delete.mock.calls).toHaveLength(0);
  });
});
