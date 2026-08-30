import { NotFoundException } from '@nestjs/common';
import { ProjectCommandEntity } from '@/project/domain/entities/project-command.entity';
import { ProjectCommandRepository } from '@/project/domain/repositories/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { UpdateProjectCommandUseCase } from '../update-project-command.usecase';

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
      description: 'Inicia os serviços do projeto',
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
  it('atualiza os campos recebidos e persiste o comando', async () => {
    const command = makeCommand();
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(),
      command,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      commandId: COMMAND_ID,
      title: 'Parar ambiente local',
      command: 'docker compose down',
    });

    expect(projectCommandRepository.update.mock.calls[0]?.[0]).toBe(command);
    expect(output).toMatchObject({
      id: COMMAND_ID,
      projectId: PROJECT_ID,
      title: 'Parar ambiente local',
      command: 'docker compose down',
      description: 'Inicia os serviços do projeto',
      executionOrder: 0,
    });
  });

  it('não atualiza comando de projeto de outro usuário', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
        title: 'Comando indevido',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.findById.mock.calls).toHaveLength(0);
    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });

  it('não atualiza comando que pertence a outro projeto', async () => {
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
        title: 'Comando indevido',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
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
        title: 'Novo título',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.update.mock.calls).toHaveLength(0);
  });
});
