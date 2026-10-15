import { getE2eUserCleanupFilter } from '../e2e-user-cleanup';

const userId = '123e4567-e89b-42d3-a456-426614174000';
const input = {
  nodeEnv: 'test',
  databaseUrl: 'postgresql://test:test@localhost:5433/devlog_test',
  userIds: [userId],
};

describe('E2E user cleanup scope', () => {
  it('restricts cleanup to tracked IDs with the E2E email prefix and domain', () => {
    expect(getE2eUserCleanupFilter(input)).toEqual({
      id: { in: [userId] },
      email: { startsWith: 'e2e-', endsWith: '@example.test' },
    });
  });

  it.each(['development', 'production', undefined])(
    'refuses cleanup in %s',
    (nodeEnv) => {
      expect(() => getE2eUserCleanupFilter({ ...input, nodeEnv })).toThrow(
        'NODE_ENV=test',
      );
    },
  );

  it.each([
    'postgresql://test:test@localhost:5432/devlog',
    'postgresql://test:test@localhost:5432/contest',
    'not-a-database-url',
    undefined,
  ])('refuses a missing or non-test database target %s', (databaseUrl) => {
    expect(() => getE2eUserCleanupFilter({ ...input, databaseUrl })).toThrow(
      'test database',
    );
  });

  it.each([
    { userIds: [] },
    { userIds: ['not-a-uuid'] },
    { userIds: [userId, ''] },
  ])('refuses an empty or invalid ID list %p', ({ userIds }) => {
    expect(() => getE2eUserCleanupFilter({ ...input, userIds })).toThrow(
      'UUID',
    );
  });
});
