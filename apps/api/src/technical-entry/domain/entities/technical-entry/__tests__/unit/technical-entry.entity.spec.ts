import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  TechnicalEntryEntity,
  type TechnicalEntryProps,
} from '../../technical-entry.entity';
import { TechnicalEntryType } from '../../technical-entry-type.enum';
import { SolutionAttemptResult } from '../../../solution-attempt/solution-attempt-result.enum';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeProps(
  overrides: Partial<TechnicalEntryProps> = {},
): TechnicalEntryProps {
  return {
    userId: USER_ID,
    title: 'Failed to start the API',
    context: 'The configured port was already in use',
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

  it('resolves an ISSUE and records the conclusion', () => {
    jest.useFakeTimers();
    const concludedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(concludedAt);
    const entry = new TechnicalEntryEntity(makeProps());

    entry.conclude('The port was released');

    expect(entry.conclusion).toBe('The port was released');
    expect(entry.resolvedAt).toEqual(concludedAt);
    expect(entry.updatedAt).toEqual(concludedAt);
    expect(entry.status).toBe('RESOLVED');
  });

  it('does not resolve a LEARNING entry', () => {
    const entry = new TechnicalEntryEntity(
      makeProps({
        type: TechnicalEntryType.LEARNING,
        conclusion: 'Learning summary',
      }),
    );

    expect(() => entry.conclude('Learning summary')).toThrow(
      EntityValidationError,
    );
    expect(entry.resolvedAt).toBeUndefined();
    expect(entry.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it.each(['', '   '])(
    'does not resolve an ISSUE without a valid conclusion (%p)',
    (conclusion) => {
      const entry = new TechnicalEntryEntity(makeProps());

      expect(() => entry.conclude(conclusion)).toThrow(EntityValidationError);
      expect(entry.resolvedAt).toBeUndefined();
      expect(entry.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    },
  );

  it('keeps resolution and archiving outside content updates', () => {
    const resolvedAt = new Date('2026-08-01T01:00:00.000Z');
    const archivedAt = new Date('2026-08-01T02:00:00.000Z');
    const entry = new TechnicalEntryEntity(
      makeProps({ resolvedAt, archivedAt, conclusion: 'Resolved' }),
    );

    entry.update({
      title: 'Updated title',
      context: 'Updated context',
    });

    expect(entry.type).toBe(TechnicalEntryType.ISSUE);
    expect(entry.resolvedAt).toEqual(resolvedAt);
    expect(entry.archivedAt).toEqual(archivedAt);
  });

  it('accepts a title with exactly 200 characters', () => {
    expect(
      () => new TechnicalEntryEntity(makeProps({ title: 'a'.repeat(200) })),
    ).not.toThrow();
  });

  it('rejects a title longer than 200 characters', () => {
    expect(
      () => new TechnicalEntryEntity(makeProps({ title: 'a'.repeat(201) })),
    ).toThrow(EntityValidationError);
  });

  it('rejects a title above the limit during an update', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    expect(() => entry.update({ title: 'a'.repeat(201) })).toThrow(
      EntityValidationError,
    );
    expect(entry.title).toBe('Failed to start the API');
  });

  it('links a valid project through the entity', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    entry.linkProject(PROJECT_ID);

    expect(entry.projectId).toBe(PROJECT_ID);
  });

  it('does not link a project with an invalid UUID', () => {
    const entry = new TechnicalEntryEntity(makeProps());

    expect(() => entry.linkProject('project-1')).toThrow(EntityValidationError);
    expect(entry.projectId).toBeUndefined();
  });

  it('does not clear the conclusion of a resolved entry', () => {
    const entry = new TechnicalEntryEntity(
      makeProps({
        conclusion: 'The port was released',
        resolvedAt: new Date('2026-08-02T12:00:00.000Z'),
      }),
    );

    expect(() => entry.update({ conclusion: null })).toThrow(
      EntityValidationError,
    );
    expect(entry.conclusion).toBe('The port was released');
  });

  it('rejects a resolved state without a conclusion on creation', () => {
    expect(
      () =>
        new TechnicalEntryEntity(
          makeProps({ resolvedAt: new Date('2026-08-02T12:00:00.000Z') }),
        ),
    ).toThrow(EntityValidationError);
  });

  it('treats an update with no fields as a no-op and preserves updatedAt', () => {
    const entry = new TechnicalEntryEntity(makeProps());
    const originalUpdatedAt = entry.updatedAt;

    expect(() => entry.update({})).not.toThrow();
    expect(entry.updatedAt).toEqual(originalUpdatedAt);
  });

  it('archives idempotently without changing resolution or project', () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(archivedAt);
    const entry = new TechnicalEntryEntity(
      makeProps({
        projectId: PROJECT_ID,
        conclusion: 'The port was released',
        resolvedAt: new Date('2026-08-02T10:00:00.000Z'),
      }),
    );

    entry.archive();
    jest.setSystemTime(new Date('2026-08-03T12:00:00.000Z'));
    entry.archive();

    expect(entry.archivedAt).toEqual(archivedAt);
    expect(entry.updatedAt).toEqual(archivedAt);
    expect(entry.projectId).toBe(PROJECT_ID);
    expect(entry.status).toBe('RESOLVED');
  });

  it('prevents new attempts after archiving', () => {
    const entry = new TechnicalEntryEntity(makeProps());
    entry.archive();

    expect(() =>
      entry.addSolutionAttempt(
        'Restart the process',
        SolutionAttemptResult.FAILED,
      ),
    ).toThrow(EntityValidationError);
  });

  it('restores idempotently without changing resolution or project', () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    const restoredAt = new Date('2026-08-03T12:00:00.000Z');
    const entry = new TechnicalEntryEntity(
      makeProps({
        projectId: PROJECT_ID,
        conclusion: 'The port was released',
        resolvedAt: new Date('2026-08-02T10:00:00.000Z'),
        archivedAt,
      }),
    );

    jest.setSystemTime(restoredAt);
    entry.restore();
    jest.setSystemTime(new Date('2026-08-04T12:00:00.000Z'));
    entry.restore();

    expect(entry.archivedAt).toBeUndefined();
    expect(entry.updatedAt).toEqual(restoredAt);
    expect(entry.projectId).toBe(PROJECT_ID);
    expect(entry.status).toBe('RESOLVED');
  });
});
