import { ValidationError } from '@/shared/domain/errors/validation-error';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import {
  SolutionAttempt,
  SolutionAttemptResult as PrismaSolutionAttemptResult,
} from '@generated/prisma/client';
import { SolutionAttemptModelMapper } from '../../solution-attempt-model.mapper';

const timestamp = new Date('2026-08-01T00:00:00.000Z');
const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174020';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeModel(overrides: Partial<SolutionAttempt> = {}): SolutionAttempt {
  return {
    id: ATTEMPT_ID,
    technicalEntryId: ENTRY_ID,
    description: 'Adicionar credentials na requisição',
    result: PrismaSolutionAttemptResult.PARTIAL,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('SolutionAttemptModelMapper', () => {
  it.each([
    [PrismaSolutionAttemptResult.FAILED, SolutionAttemptResult.FAILED],
    [PrismaSolutionAttemptResult.PARTIAL, SolutionAttemptResult.PARTIAL],
    [PrismaSolutionAttemptResult.SUCCESSFUL, SolutionAttemptResult.SUCCESSFUL],
  ])(
    'converte o resultado %s do Prisma para o domínio',
    (prismaResult, domainResult) => {
      expect(
        SolutionAttemptModelMapper.toEntity(makeModel({ result: prismaResult }))
          .result,
      ).toBe(domainResult);
    },
  );

  it.each([
    [SolutionAttemptResult.FAILED, PrismaSolutionAttemptResult.FAILED],
    [SolutionAttemptResult.PARTIAL, PrismaSolutionAttemptResult.PARTIAL],
    [SolutionAttemptResult.SUCCESSFUL, PrismaSolutionAttemptResult.SUCCESSFUL],
  ])(
    'converte o resultado %s do domínio para o Prisma',
    (domainResult, prismaResult) => {
      expect(SolutionAttemptModelMapper.toPrismaResult(domainResult)).toBe(
        prismaResult,
      );
    },
  );

  it('converte entidade para persistência', () => {
    const entity = new SolutionAttemptEntity(
      {
        technicalEntryId: ENTRY_ID,
        description: 'Adicionar credentials na requisição',
        result: SolutionAttemptResult.SUCCESSFUL,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ATTEMPT_ID,
    );

    expect(SolutionAttemptModelMapper.toPersistence(entity)).toEqual({
      id: ATTEMPT_ID,
      technicalEntryId: ENTRY_ID,
      description: 'Adicionar credentials na requisição',
      result: PrismaSolutionAttemptResult.SUCCESSFUL,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  it('rejeita resultados desconhecidos nas duas direções', () => {
    expect(() =>
      SolutionAttemptModelMapper.toEntity(
        makeModel({ result: 'UNKNOWN' as PrismaSolutionAttemptResult }),
      ),
    ).toThrow(ValidationError);
    expect(() =>
      SolutionAttemptModelMapper.toPrismaResult(
        'UNKNOWN' as SolutionAttemptResult,
      ),
    ).toThrow(ValidationError);
  });

  it('encapsula erro de validação ao hidratar uma entidade inválida', () => {
    expect(() =>
      SolutionAttemptModelMapper.toEntity(makeModel({ description: '' })),
    ).toThrow(ValidationError);
  });
});
