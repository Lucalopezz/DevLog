import { NotFoundException } from '@nestjs/common';
import { ProjectCommandRepository } from '@/project/domain/repositories/command/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { AddProjectCommandUseCase } from '../../add-project-command.usecase';

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

function makeUseCase(project: ProjectEntity | null = makeProject()) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectCommandRepository = {
    insert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectCommandRepository>;

  return {
    useCase: new AddProjectCommandUseCase(
      projectRepository,
      projectCommandRepository,
    ),
    projectRepository,
    projectCommandRepository,
  };
}

describe('AddProjectCommandUseCase', () => {
  it('creates and returns the project command', async () => {
    const { useCase, projectCommandRepository } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      title: 'Start local environment',
      command: 'docker compose up -d',
      description: 'Start project services',
      executionOrder: 1,
    });

    expect(projectCommandRepository.insert.mock.calls).toHaveLength(1);
    expect(projectCommandRepository.insert.mock.calls[0]?.[0]).toMatchObject({
      projectId: PROJECT_ID,
      title: 'Start local environment',
      command: 'docker compose up -d',
      description: 'Start project services',
      executionOrder: 1,
    });
    expect(output).toMatchObject({
      projectId: PROJECT_ID,
      title: 'Start local environment',
      command: 'docker compose up -d',
    });
    expect(output).not.toHaveProperty('name');
  });

  it("does not create a command for another user's project", async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        title: 'Unauthorized command',
        command: 'echo unsafe',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.insert.mock.calls).toHaveLength(0);
  });
});
