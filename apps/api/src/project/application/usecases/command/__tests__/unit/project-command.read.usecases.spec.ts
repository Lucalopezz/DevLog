import { NotFoundException } from '@nestjs/common';
import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';
import {
  ProjectCommandRepository,
  ProjectCommandSearchResult,
} from '@/project/domain/repositories/command/project-command.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { GetProjectCommandUseCase } from '../../get-project-command.usecase';
import { SearchProjectCommandUseCase } from '../../search-project-command.usecase';

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

describe('SearchProjectCommandUseCase', () => {
  it('busca comandos somente dentro do projeto autorizado', async () => {
    const project = makeProject();
    const command = makeCommand();
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectCommandRepository = {
      search: jest.fn().mockResolvedValue(
        new ProjectCommandSearchResult({
          items: [command],
          total: 1,
          currentPage: 2,
          perPage: 10,
          sort: 'title',
          sortDir: 'asc',
          filter: { projectId: PROJECT_ID, title: 'ambiente' },
        }),
      ),
    } as unknown as jest.Mocked<ProjectCommandRepository>;
    const useCase = new SearchProjectCommandUseCase(
      projectRepository,
      projectCommandRepository,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      page: 2,
      perPage: 10,
      sort: 'title',
      sortDir: 'asc',
      title: 'ambiente',
      command: 'docker',
      description: 'serviços',
    });

    expect(projectCommandRepository.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        page: 2,
        perPage: 10,
        sort: 'title',
        sortDir: 'asc',
        filter: {
          projectId: PROJECT_ID,
          title: 'ambiente',
          command: 'docker',
          description: 'serviços',
        },
      }),
    );
    expect(output).toMatchObject({
      items: [
        expect.objectContaining({
          id: COMMAND_ID,
          projectId: PROJECT_ID,
          title: 'Subir ambiente local',
        }),
      ],
      total: 1,
      currentPage: 2,
      perPage: 10,
      lastPage: 1,
    });
  });

  it('não busca comandos de projeto de outro usuário', async () => {
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(makeProject(OTHER_USER_ID)),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectCommandRepository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<ProjectCommandRepository>;
    const useCase = new SearchProjectCommandUseCase(
      projectRepository,
      projectCommandRepository,
    );

    await expect(
      useCase.execute({ userId: USER_ID, projectId: PROJECT_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(projectCommandRepository.search.mock.calls).toHaveLength(0);
  });
});

describe('GetProjectCommandUseCase', () => {
  function makeUseCase(
    project: ProjectEntity | null = makeProject(),
    command: ProjectCommandEntity | null = makeCommand(),
  ) {
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectCommandRepository = {
      findById: jest.fn().mockResolvedValue(command),
    } as unknown as jest.Mocked<ProjectCommandRepository>;

    return {
      useCase: new GetProjectCommandUseCase(
        projectRepository,
        projectCommandRepository,
      ),
      projectCommandRepository,
    };
  }

  it('retorna o comando quando ele pertence ao projeto do usuário', async () => {
    const { useCase } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      commandId: COMMAND_ID,
    });

    expect(output).toMatchObject({
      id: COMMAND_ID,
      projectId: PROJECT_ID,
      title: 'Subir ambiente local',
    });
  });

  it('não retorna comando de projeto de outro usuário', async () => {
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
  });

  it('não retorna comando que pertence a outro projeto', async () => {
    const { useCase } = makeUseCase(
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
  });

  it('retorna erro quando o comando não existe', async () => {
    const { useCase } = makeUseCase(makeProject(), null);

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        commandId: COMMAND_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
