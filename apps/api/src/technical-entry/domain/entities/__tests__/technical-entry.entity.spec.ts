import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  TechnicalEntryEntity,
  type TechnicalEntryProps,
} from '../technical-entry.entity';
import { TechnicalEntryType } from '../technical-entry-type.enum';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeProps(
  overrides: Partial<TechnicalEntryProps> = {},
): TechnicalEntryProps {
  return {
    userId: USER_ID,
    title: 'Falha ao iniciar a API',
    context: 'A porta configurada já estava em uso',
    type: TechnicalEntryType.ISSUE,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('TechnicalEntryEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('conclui uma ISSUE registrando a conclusão', () => {
    jest.useFakeTimers();
    const concludedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(concludedAt);
    const entry = new TechnicalEntryEntity(makeProps());

    entry.conclude('A porta foi liberada');

    expect(entry.conclusion).toBe('A porta foi liberada');
    expect(entry.resolvedAt).toEqual(concludedAt);
    expect(entry.updatedAt).toEqual(concludedAt);
    expect(entry.status).toBe('RESOLVED');
  });

  it('não permite concluir uma entrada LEARNING', () => {
    const entry = new TechnicalEntryEntity(
      makeProps({
        type: TechnicalEntryType.LEARNING,
        conclusion: 'Resumo do aprendizado',
      }),
    );

    expect(() => entry.conclude('Resumo do aprendizado')).toThrow(
      EntityValidationError,
    );
    expect(entry.resolvedAt).toBeUndefined();
    expect(entry.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it.each(['', '   '])(
    'não permite concluir uma ISSUE sem conclusão válida (%p)',
    (conclusion) => {
      const entry = new TechnicalEntryEntity(makeProps());

      expect(() => entry.conclude(conclusion)).toThrow(EntityValidationError);
      expect(entry.resolvedAt).toBeUndefined();
      expect(entry.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    },
  );

  it('mantém resolução e arquivamento fora da atualização de conteúdo', () => {
    const resolvedAt = new Date('2026-08-01T01:00:00.000Z');
    const archivedAt = new Date('2026-08-01T02:00:00.000Z');
    const entry = new TechnicalEntryEntity(
      makeProps({ resolvedAt, archivedAt, conclusion: 'Resolvido' }),
    );

    entry.update('Título atualizado', 'Contexto atualizado');

    expect(entry.type).toBe(TechnicalEntryType.ISSUE);
    expect(entry.resolvedAt).toEqual(resolvedAt);
    expect(entry.archivedAt).toEqual(archivedAt);
  });

  it('aceita título com exatamente 200 caracteres', () => {
    expect(
      () => new TechnicalEntryEntity(makeProps({ title: 'a'.repeat(200) })),
    ).not.toThrow();
  });

  it('rejeita título com mais de 200 caracteres', () => {
    expect(
      () => new TechnicalEntryEntity(makeProps({ title: 'a'.repeat(201) })),
    ).toThrow(EntityValidationError);
  });

  it('rejeita título acima do limite durante a atualização', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    expect(() => entry.update('a'.repeat(201))).toThrow(EntityValidationError);
    expect(entry.title).toBe('Falha ao iniciar a API');
  });

  it('vincula um projeto válido através da entidade', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    entry.linkProject(PROJECT_ID);

    expect(entry.projectId).toBe(PROJECT_ID);
  });

  it('não vincula um projeto com UUID inválido', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    expect(() => entry.linkProject('project-1')).toThrow(EntityValidationError);
    expect(entry.projectId).toBeUndefined();
  });
});
