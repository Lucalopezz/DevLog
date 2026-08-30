import { NotFoundException } from '@nestjs/common';
import { ProjectCommandEntity } from '@/project/domain/entities/project-command.entity';
import { ProjectCommandRepository } from '@/project/domain/repositories/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { RemoveProjectCommandUseCase } from '../remove-project-command.usecase';

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
      title: 'Subir ambiente local',
      command: 'docker compose up -d',
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
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectCommandRepository>;

  return {
    useCase: new RemoveProjectCommandUseCase(
      projectRepository,
      projectCommandRepository,
    ),
    projectRepository,
    projectCommandRepository,
  };
}

describe('RemoveProjectCommandUseCase', () => {
  it('remove o comando do projeto do usuário autenticado', async () => {
    const { useCase, projectCommandRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      commandId: COMMAND_ID,
    });

    expect(projectCommandRepository.delete.mock.calls[0]?.[0]).toBe(COMMAND_ID);
  });

  it('não remove comando de projeto de outro usuário', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.findById.mock.calls).toHaveLength(0);
    expect(projectCommandRepository.delete.mock.calls).toHaveLength(0);
  });

  it('não remove comando que pertence a outro projeto', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      makeCommand(OTHER_PROJECT_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.delete.mock.calls).toHaveLength(0);
  });

  it('retorna erro quando o comando não existe', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      null,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.delete.mock.calls).toHaveLength(0);
  });
});
