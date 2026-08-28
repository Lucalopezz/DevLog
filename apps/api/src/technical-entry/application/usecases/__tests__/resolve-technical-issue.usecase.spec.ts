import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ResolveTechnicalIssueUseCase } from '../resolve-technical-issue.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(
  overrides: Partial<{
    userId: string;
    type: TechnicalEntryType;
    conclusion: string;
    resolvedAt: Date;
  }> = {},
) {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new TechnicalEntryEntity(
    {
      userId: overrides.userId ?? USER_ID,
      title: 'Erro na API',
      context: 'Investigando o erro da API',
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      conclusion: overrides.conclusion,
      resolvedAt: overrides.resolvedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    ENTRY_ID,
  );
}

function makeRepository(entry: TechnicalEntryEntity | null = makeEntry()) {
  return {
    repository: {
      findById: jest.fn().mockResolvedValue(entry),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TechnicalEntryRepository>,
  };
}

describe('ResolveTechnicalIssueUseCase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolve uma ISSUE aberta e registra a conclusão e resolvedAt', async () => {
    jest.useFakeTimers();
    const resolvedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(resolvedAt);
    const entry = makeEntry();
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    const output = await useCase.execute({
      id: ENTRY_ID,
      userId: USER_ID,
      conclusion: 'A porta foi liberada',
    });

    expect(repository.update.mock.calls).toEqual([[entry]]);
    expect(output).toMatchObject({
      id: ENTRY_ID,
      conclusion: 'A porta foi liberada',
      status: TechnicalEntryStatus.RESOLVED,
      resolvedAt,
    });
  });

  it('permite resolver sem consultar ou exigir tentativa SUCCESSFUL', async () => {
    const entry = makeEntry();
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({
        id: ENTRY_ID,
        userId: USER_ID,
        conclusion: 'Resolvido diretamente',
      }),
    ).resolves.toMatchObject({ status: TechnicalEntryStatus.RESOLVED });
  });

  it('rejeita conclusão vazia', async () => {
    const entry = makeEntry();
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({
        id: ENTRY_ID,
        userId: USER_ID,
        conclusion: '   ',
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);

    expect(repository.update.mock.calls).toHaveLength(0);
    expect(entry.status).toBe(TechnicalEntryStatus.OPEN);
  });

  it('rejeita entradas LEARNING', async () => {
    const entry = makeEntry({ type: TechnicalEntryType.LEARNING });
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({
        id: ENTRY_ID,
        userId: USER_ID,
        conclusion: 'Resumo do aprendizado',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('não permite resolver novamente uma ISSUE já resolvida', async () => {
    const entry = makeEntry({
      conclusion: 'Conclusão anterior',
      resolvedAt: new Date('2026-08-02T12:00:00.000Z'),
    });
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({
        id: ENTRY_ID,
        userId: USER_ID,
        conclusion: 'Nova conclusão',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('não resolve uma entrada de outro usuário', async () => {
    const entry = makeEntry({ userId: OTHER_USER_ID });
    const { repository } = makeRepository(entry);
    const useCase = new ResolveTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({
        id: ENTRY_ID,
        userId: USER_ID,
        conclusion: 'Tentativa indevida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
    expect(entry.status).toBe(TechnicalEntryStatus.OPEN);
  });
});
