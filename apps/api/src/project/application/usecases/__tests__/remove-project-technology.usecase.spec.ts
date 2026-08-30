import { NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectTechnologyEntity } from '@/project/domain/entities/project-technology.entity';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/project-technology.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { RemoveProjectTechnologyUseCase } from '../remove-project-technology.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174002';
const TECHNOLOGY_ID = '123e4567-e89b-42d3-a456-426614174003';

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

function makeTechnology(projectId = PROJECT_ID) {
  return new ProjectTechnologyEntity(
    {
      projectId,
      name: 'NestJS',
      version: '11',
    },
    TECHNOLOGY_ID,
  );
}

function makeUseCase(
  project: ProjectEntity | null = makeProject(),
  technology: ProjectTechnologyEntity | null = makeTechnology(),
) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectTechnologyRepository = {
    findById: jest.fn().mockResolvedValue(technology),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectTechnologyRepository>;

  return {
    useCase: new RemoveProjectTechnologyUseCase(
      projectRepository,
      projectTechnologyRepository,
    ),
    projectRepository,
    projectTechnologyRepository,
  };
}

describe('RemoveProjectTechnologyUseCase', () => {
  it('remove a tecnologia pertencente ao projeto do usuário', async () => {
    const { useCase, projectTechnologyRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      technologyId: TECHNOLOGY_ID,
    });

    expect(projectTechnologyRepository.delete.mock.calls[0]?.[0]).toBe(
      TECHNOLOGY_ID,
    );
  });

  it('não remove tecnologia de projeto de outro usuário', async () => {
    const { useCase, projectTechnologyRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        technologyId: TECHNOLOGY_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectTechnologyRepository.delete.mock.calls).toHaveLength(0);
  });

  it('não remove tecnologia que pertence a outro projeto', async () => {
    const otherProjectId = '123e4567-e89b-42d3-a456-426614174004';
    const { useCase, projectTechnologyRepository } = makeUseCase(
      makeProject(),
      makeTechnology(otherProjectId),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        technologyId: TECHNOLOGY_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectTechnologyRepository.delete.mock.calls).toHaveLength(0);
  });
});
