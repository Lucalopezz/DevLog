import { NotFoundException } from '@nestjs/common';
import { SearchResult } from '@/shared/domain/repositories/searchable.repository';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { DeleteTechnicalEntryUseCase } from '../delete-technical-entry.usecase';
import { GetTechnicalEntryUseCase } from '../get-technical-entry.usecase';
import { UpdateTechnicalEntryUseCase } from '../update-technical-entry.usecase';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/technical-entry-tag.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const OTHER_PROJECT_ID = '123e4567-e89b-42d3-a456-426614174011';

class InMemoryTechnicalEntryRepository implements TechnicalEntryRepository {
  sortableFields = ['createdAt', 'updatedAt', 'title'];
  entries: TechnicalEntryEntity[] = [];

  insert(entity: TechnicalEntryEntity): Promise<void> {
    this.entries.push(entity);
    return Promise.resolve();
  }

  findById(id: string): Promise<TechnicalEntryEntity | null> {
    return Promise.resolve(
      this.entries.find((entry) => entry.id === id) ?? null,
    );
  }

  findAll(): Promise<TechnicalEntryEntity[]> {
    return Promise.resolve(this.entries);
  }

  update(entity: TechnicalEntryEntity): Promise<void> {
    const index = this.entries.findIndex((entry) => entry.id === entity.id);
    this.entries[index] = entity;
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.entries = this.entries.filter((entry) => entry.id !== id);
    return Promise.resolve();
  }

  findByOwnerId(userId: string): Promise<TechnicalEntryEntity[]> {
    return Promise.resolve(
      this.entries.filter((entry) => entry.userId === userId),
    );
  }

  search(): Promise<SearchResult<TechnicalEntryEntity>> {
    return Promise.reject(new Error('Not implemented in this test'));
  }
}

function makeEntry(
  overrides: Partial<{
    id: string;
    userId: string;
    projectId: string;
    title: string;
    context: string;
    conclusion: string;
    type: TechnicalEntryType;
    resolvedAt: Date;
  }> = {},
) {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new TechnicalEntryEntity(
    {
      userId: overrides.userId ?? USER_ID,
      projectId: overrides.projectId,
      title: overrides.title ?? 'Título da entrada',
      context: overrides.context ?? 'Contexto da entrada',
      conclusion: overrides.conclusion,
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      resolvedAt: overrides.resolvedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    overrides.id,
  );
}

function makeProjectRepository(
  project: { userId: string; archivedAt?: Date } | null = {
    userId: USER_ID,
  },
) {
  return {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
}

describe('Casos de uso de entrada técnica', () => {
  describe('GetTechnicalEntryUseCase', () => {
    it('retorna a entrada completa do usuário autenticado', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({ projectId: PROJECT_ID });
      repository.entries.push(entry);
      const technicalEntryTagRepository = {
        findTags: jest.fn().mockResolvedValue(new Map()),
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new GetTechnicalEntryUseCase(
        repository,
        technicalEntryTagRepository,
      );

      await expect(
        useCase.execute({ id: entry.id, userId: USER_ID }),
      ).resolves.toMatchObject({
        id: entry.id,
        projectId: PROJECT_ID,
        status: 'OPEN',
        tags: [],
      });
    });

    it('não encontra uma entrada de outro usuário', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({ userId: OTHER_USER_ID });
      repository.entries.push(entry);
      const technicalEntryTagRepository = {
        findTags: jest.fn().mockResolvedValue(new Map()),
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new GetTechnicalEntryUseCase(
        repository,
        technicalEntryTagRepository,
      );

      await expect(
        useCase.execute({ id: entry.id, userId: USER_ID }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('UpdateTechnicalEntryUseCase', () => {
    it('atualiza o conteúdo e o projeto sem alterar o tipo', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({ type: TechnicalEntryType.ISSUE });
      repository.entries.push(entry);
      const useCase = new UpdateTechnicalEntryUseCase(
        repository,
        makeProjectRepository(),
      );

      const output = await useCase.execute({
        id: entry.id,
        userId: USER_ID,
        title: 'Novo título',
        context: 'Novo contexto',
        conclusion: 'Nova conclusão',
        projectId: OTHER_PROJECT_ID,
      });

      expect(output).toMatchObject({
        title: 'Novo título',
        context: 'Novo contexto',
        conclusion: 'Nova conclusão',
        projectId: OTHER_PROJECT_ID,
        type: TechnicalEntryType.ISSUE,
      });
    });

    it('permite remover a conclusão e o projeto', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({
        conclusion: 'Conclusão antiga',
        projectId: PROJECT_ID,
      });
      repository.entries.push(entry);
      const useCase = new UpdateTechnicalEntryUseCase(
        repository,
        makeProjectRepository(),
      );

      const output = await useCase.execute({
        id: entry.id,
        userId: USER_ID,
        conclusion: null,
        projectId: null,
      });

      expect(output.conclusion).toBeUndefined();
      expect(output.projectId).toBeUndefined();
    });

    it('não atualiza uma entrada de outro usuário', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({ userId: OTHER_USER_ID });
      repository.entries.push(entry);
      const useCase = new UpdateTechnicalEntryUseCase(
        repository,
        makeProjectRepository(),
      );

      await expect(
        useCase.execute({
          id: entry.id,
          userId: USER_ID,
          title: 'Tentativa indevida',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('não vincula a entrada a um projeto de outro usuário', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry();
      repository.entries.push(entry);
      const useCase = new UpdateTechnicalEntryUseCase(
        repository,
        makeProjectRepository({ userId: OTHER_USER_ID }),
      );

      await expect(
        useCase.execute({
          id: entry.id,
          userId: USER_ID,
          projectId: OTHER_PROJECT_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(entry.projectId).toBeUndefined();
    });
  });

  describe('DeleteTechnicalEntryUseCase', () => {
    it('remove a entrada do usuário autenticado', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry();
      repository.entries.push(entry);
      const useCase = new DeleteTechnicalEntryUseCase(repository);

      await useCase.execute({ id: entry.id, userId: USER_ID });

      expect(repository.entries).toHaveLength(0);
    });

    it('não remove uma entrada de outro usuário', async () => {
      const repository = new InMemoryTechnicalEntryRepository();
      const entry = makeEntry({ userId: OTHER_USER_ID });
      repository.entries.push(entry);
      const useCase = new DeleteTechnicalEntryUseCase(repository);

      await expect(
        useCase.execute({ id: entry.id, userId: USER_ID }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.entries).toHaveLength(1);
    });
  });
});
