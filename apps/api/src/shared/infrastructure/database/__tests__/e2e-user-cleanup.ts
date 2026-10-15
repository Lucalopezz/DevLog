export function getE2eUserCleanupFilter(input: {
  nodeEnv: string | undefined;
  databaseUrl: string | undefined;
  userIds: string[];
}) {
  if (input.nodeEnv !== 'test')
    throw new Error('Cleanup requires NODE_ENV=test.');

  let databaseName: string;
  try {
    const url = new URL(input.databaseUrl ?? '');
    databaseName = decodeURIComponent(url.pathname.slice(1));
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('Cleanup requires a valid PostgreSQL test database URL.');
  }
  if (!/(^|_)test($|_)/i.test(databaseName)) {
    throw new Error(
      'Cleanup requires a test database name with a test segment.',
    );
  }

  const uuid =
    /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
  if (!input.userIds.length || !input.userIds.every((id) => uuid.test(id))) {
    throw new Error(
      'Cleanup requires a nonempty list of tracked UUID v4 user IDs.',
    );
  }

  // Both conditions must match: even a wrong manifest cannot remove a normal account.
  return {
    id: { in: input.userIds },
    email: { startsWith: 'e2e-', endsWith: '@example.test' },
  };
}
