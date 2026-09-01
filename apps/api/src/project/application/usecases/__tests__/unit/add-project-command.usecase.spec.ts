import { NotFoundException } from '@nestjs/common';
import { ProjectCommandRepository } from '@/project/domain/repositories/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
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
  it('cria e retorna o comando do projeto', async () => {
    const { useCase, projectCommandRepository } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      title: 'Subir ambiente local',
      command: 'docker compose up -d',
      description: 'Inicia os serviços do projeto',
      executionOrder: 1,
    });

    expect(projectCommandRepository.insert.mock.calls).toHaveLength(1);
    expect(projectCommandRepository.insert.mock.calls[0]?.[0]).toMatchObject({
      projectId: PROJECT_ID,
      title: 'Subir ambiente local',
      command: 'docker compose up -d',
      description: 'Inicia os serviços do projeto',
      executionOrder: 1,
    });
    expect(output).toMatchObject({
      projectId: PROJECT_ID,
      title: 'Subir ambiente local',
      command: 'docker compose up -d',
    });
    expect(output).not.toHaveProperty('name');
  });

  it('não cria comando para projeto de outro usuário', async () => {
    const { useCase, projectCommandRepository } = makeUseCase(
      makeProject(OTHER_USER_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        title: 'Comando indevido',
        command: 'echo unsafe',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.insert.mock.calls).toHaveLength(0);
  });
});
