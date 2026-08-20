import { NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import {
  ProjectRepository,
  ProjectSearchResult,
} from '@/project/domain/repositories/project.repository';
import { DeleteProjectUseCase } from '../delete-project.usecase';
import { GetProjectUseCase } from '../get-project.usecase';
import { SearchProjectUseCase } from '../search-project.usecase';
import { UpdateProjectUseCase } from '../update-project.usecase';
import { UpdateProjectDescriptionUseCase } from '../update-project-description.usecase';
import { UpdateProjectPathUseCase } from '../update-project-path.usecase';
import { ArchiveProjectUseCase } from '../archive-project.usecase';
import { RestoreProjectUseCase } from '../restore-project.usecase';

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

function makeRepository(project: ProjectEntity | null = makeProject()) {
  return {
    repository: {
      findById: jest.fn().mockResolvedValue(project),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProjectRepository>,
  };
}

describe('Project use cases', () => {
  it('retorna o projeto quando ele pertence ao usuário', async () => {
    const { repository } = makeRepository();
    const useCase = new GetProjectUseCase(repository);

    const output = await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(output).toMatchObject({ id: PROJECT_ID, name: 'DevLog' });
  });

  it('não expõe projeto de outro usuário na consulta', async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new GetProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atualiza apenas os campos recebidos', async () => {
    const project = makeProject();
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectUseCase(repository);

    const output = await useCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
      name: 'DevLog atualizado',
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.name).toBe('DevLog atualizado');
    expect(output.status).toBe(ProjectStatusEnum.ACTIVE);
  });

  it('não atualiza um projeto de outro usuário', async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new UpdateProjectUseCase(repository);

    await expect(
      useCase.execute({
        id: PROJECT_ID,
        userId: USER_ID,
        name: 'Tentativa indevida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('atualiza e remove a descrição pelo caso de uso específico', async () => {
    const project = makeProject();
    project.updateDescription('Descrição atual');
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectDescriptionUseCase(repository);

    const output = await useCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
      description: '',
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.description).toBeUndefined();
  });

  it('atualiza e remove o caminho local pelo caso de uso específico', async () => {
    const project = makeProject();
    project.updatePath('/workspace/devlog');
    const { repository } = makeRepository(project);
    const useCase = new UpdateProjectPathUseCase(repository);

    const output = await useCase.execute({
      id: PROJECT_ID,
      userId: USER_ID,
      localPath: '',
    });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.localPath).toBeUndefined();
  });

  it('remove o projeto somente quando ele pertence ao usuário', async () => {
    const { repository } = makeRepository();
    const useCase = new DeleteProjectUseCase(repository);

    await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(repository.delete.mock.calls[0]?.[0]).toBe(PROJECT_ID);
  });

  it('não remove um projeto de outro usuário', async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new DeleteProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('arquiva o projeto do usuário autenticado', async () => {
    const project = makeProject();
    const { repository } = makeRepository(project);
    const useCase = new ArchiveProjectUseCase(repository);

    const output = await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.archivedAt).toBeDefined();
  });

  it('não arquiva um projeto de outro usuário', async () => {
    const { repository } = makeRepository(makeProject(OTHER_USER_ID));
    const useCase = new ArchiveProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('desarquiva o projeto do usuário autenticado', async () => {
    const project = makeProject();
    project.archive();
    const { repository } = makeRepository(project);
    const useCase = new RestoreProjectUseCase(repository);

    const output = await useCase.execute({ id: PROJECT_ID, userId: USER_ID });

    expect(repository.update.mock.calls[0]?.[0]).toBe(project);
    expect(output.archivedAt).toBeUndefined();
  });

  it('não desarquiva um projeto de outro usuário', async () => {
    const project = makeProject(OTHER_USER_ID);
    project.archive();
    const { repository } = makeRepository(project);
    const useCase = new RestoreProjectUseCase(repository);

    await expect(
      useCase.execute({ id: PROJECT_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('monta o filtro de busca com os parâmetros recebidos', async () => {
    const archivedAt = new Date('2026-08-01T00:00:00.000Z');
    const repository = {
      search: jest.fn().mockResolvedValue(
        new ProjectSearchResult({
          items: [makeProject()],
          total: 1,
          currentPage: 1,
          perPage: 15,
          filter: { userId: USER_ID },
        }),
      ),
    } as unknown as jest.Mocked<ProjectRepository>;
    const useCase = new SearchProjectUseCase(repository);

    await useCase.execute({
      userId: USER_ID,
      page: 2,
      perPage: 10,
      sort: 'name',
      sortDir: 'desc',
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
      archivedAt,
    });

    expect(repository.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        page: 2,
        perPage: 10,
        sort: 'name',
        sortDir: 'desc',
        filter: {
          userId: USER_ID,
          name: 'DevLog',
          status: ProjectStatusEnum.ACTIVE,
          archivedAt,
        },
      }),
    );
  });
});
