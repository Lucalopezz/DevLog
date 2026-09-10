import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';
import { ProjectCommandRepository } from '@/project/domain/repositories/command/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UpdateProjectCommandUseCase } from '../../update-project-command.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174002';
const OTHER_PROJECT_ID = '123e4567-e89b-42d3-a456-426614174003';
const COMMAND_ID = '123e4567-e89b-42d3-a456-426614174004';

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

function makeCommand(projectId = PROJECT_ID): ProjectCommandEntity {
  return new ProjectCommandEntity(
    {
      projectId,
      title: 'Start local environment',
      command: 'docker compose up -d',
      description: 'Start project services',
      executionOrder: 0,
    },
    COMMAND_ID,
  );
}

function makeUseCase(
  project: ProjectEntity | null = makeProject(),
  command: ProjectCommandEntity | null = makeCommand(),
) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectCommandRepository = {
    findById: jest.fn().mockResolvedValue(command),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectCommandRepository>;

  return {
    useCase: new UpdateProjectCommandUseCase(
      projectRepository,
      projectCommandRepository,
    ),
    projectRepository,
    projectCommandRepository,
  };
}

describe('UpdateProjectCommandUseCase', () => {
  it('updates supplied fields and persists the command', async () => {
    const command = makeCommand();
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      command,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      commandId: COMMAND_ID,
      title: 'Stop local environment',
      command: 'docker compose down',
    });

    expect(projectCommandRepository.update.mock.calls[0]?.[0]).toBe(command);
    expect(output).toMatchObject({
      id: COMMAND_ID,
      projectId: PROJECT_ID,
      title: 'Stop local environment',
      command: 'docker compose down',
      description: 'Start project services',
      executionOrder: 0,
    });
  });

  it("does not update a command in another user's project", async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
        title: 'Unauthorized command',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.findById.mock.calls).toHaveLength(0);
    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });

  it('clears description and order when receiving null', async () => {
    const command = makeCommand();
    const { useCase } = makeUseCase(makeProject(), command);

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      commandId: COMMAND_ID,
      description: null,
      executionOrder: null,
    });

    expect(output.description).toBeUndefined();
    expect(output.executionOrder).toBeUndefined();
  });

  it('rejects an update with no fields', async () => {
    const { useCase, projectCommandRepository } = makeUseCase();

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });

  it('does not update a command belonging to another project', async () => {
    const command = makeCommand(OTHER_PROJECT_ID);
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      command,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
        title: 'Unauthorized command',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });

  it('returns an error when the command does not exist', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      null,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
        title: 'New title',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });
});
