import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '../../..');
const image = 'devlog-api-vercel:smoke-test';

function docker(args: string[]) {
  return execFileSync('docker', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

void test(
  'the Vercel API image migrates its database before serving requests',
  { timeout: 240_000 },
  async () => {
    docker(['build', '--quiet', '-f', 'Dockerfile.vercel', '-t', image, '.']);
    assert.equal(
      docker([
        'run',
        '--rm',
        '--entrypoint',
        'sh',
        image,
        '-c',
        "find /app -name '.env*' -print",
      ]),
      '',
      'The container must not contain local environment files',
    );

    const network = `devlog-vercel-smoke-${randomUUID()}`;
    docker(['network', 'create', network]);
    let databaseId: string | undefined;
    let containerId: string | undefined;

    try {
      databaseId = docker([
        'run',
        '--detach',
        '--rm',
        '--network',
        network,
        '--network-alias',
        'database',
        '--env',
        'POSTGRES_USER=smoke',
        '--env',
        'POSTGRES_PASSWORD=smoke',
        '--env',
        'POSTGRES_DB=smoke',
        'postgres:17-alpine',
      ]);
      for (let attempt = 0; attempt < 60; attempt++) {
        try {
          docker([
            'exec',
            databaseId,
            'pg_isready',
            '-U',
            'smoke',
            '-d',
            'smoke',
          ]);
          break;
        } catch {
          await new Promise((done) => setTimeout(done, 500));
        }
      }

      containerId = docker([
        'run',
        '--detach',
        '--rm',
        '--network',
        network,
        '--publish',
        '127.0.0.1::80',
        '--env',
        'DATABASE_URL=postgresql://smoke:smoke@database:5432/smoke',
        '--env',
        'JWT_SECRET=local-smoke-test-only',
        image,
      ]);
      const address = docker(['port', containerId, '80/tcp']);
      const port = Number(address.split(':').at(-1));
      assert.ok(Number.isInteger(port) && port > 0);

      let health: Response | undefined;
      for (let attempt = 0; attempt < 60; attempt++) {
        try {
          health = await fetch(`http://127.0.0.1:${port}/api/health`);
          break;
        } catch {
          await new Promise((done) => setTimeout(done, 500));
        }
      }

      if (!health) {
        throw new Error(
          `API did not start. Container logs:\n${docker(['logs', containerId])}`,
        );
      }
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { status: 'ok' });
      assert.equal(
        docker([
          'exec',
          databaseId,
          'psql',
          '-U',
          'smoke',
          '-d',
          'smoke',
          '-tAc',
          "SELECT to_regclass('public.project_todos')",
        ]),
        'project_todos',
      );

      const privateRoute = await fetch(`http://127.0.0.1:${port}/api/users/me`);
      assert.equal(privateRoute.status, 401);
    } finally {
      // The test owns this disposable container and always stops it.
      for (const id of [containerId, databaseId]) {
        if (!id) continue;
        try {
          docker(['stop', '--time', '1', id]);
        } catch {
          // Docker already removed a container that exited on its own.
        }
      }
      docker(['network', 'rm', network]);
    }
  },
);
