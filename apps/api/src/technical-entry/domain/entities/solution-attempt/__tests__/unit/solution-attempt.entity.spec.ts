import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  SolutionAttemptEntity,
  type SolutionAttemptProps,
} from '../../solution-attempt.entity';
import { SolutionAttemptResult } from '../../solution-attempt-result.enum';

const TECHNICAL_ENTRY_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(
  overrides: Partial<SolutionAttemptProps> = {},
): SolutionAttemptProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    technicalEntryId: TECHNICAL_ENTRY_ID,
    description: 'Adicionar credentials: include na requisição',
    result: SolutionAttemptResult.PARTIAL,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('SolutionAttemptEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria uma tentativa válida', () => {
    const attempt = new SolutionAttemptEntity(makeProps());

    expect(attempt.technicalEntryId).toBe(TECHNICAL_ENTRY_ID);
    expect(attempt.description).toBe(
      'Adicionar credentials: include na requisição',
    );
    expect(attempt.result).toBe(SolutionAttemptResult.PARTIAL);
  });

  it.each([
    ['technicalEntryId', { technicalEntryId: 'entry-1' }],
    ['description', { description: '' }],
    ['result', { result: 'UNKNOWN' as SolutionAttemptResult }],
  ])('rejeita %s inválido na criação', (_, overrides) => {
    expect(() => new SolutionAttemptEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('atualiza a descrição e preserva o resultado', () => {
    jest.useFakeTimers();
    const updatedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(updatedAt);
    const attempt = new SolutionAttemptEntity(makeProps());

    attempt.updateDescription('Corrigir o cabeçalho da requisição');

    expect(attempt.description).toBe('Corrigir o cabeçalho da requisição');
    expect(attempt.result).toBe(SolutionAttemptResult.PARTIAL);
    expect(attempt.updatedAt).toEqual(updatedAt);
  });

  it('não altera a descrição quando a atualização é inválida', () => {
    const attempt = new SolutionAttemptEntity(makeProps());

    expect(() => attempt.updateDescription('')).toThrow(EntityValidationError);
    expect(attempt.description).toBe(
      'Adicionar credentials: include na requisição',
    );
    expect(attempt.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });
});
