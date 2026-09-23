import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@generated/prisma/client';

const targetEmail = 'teste@teste.com';
const confirmation = `--confirm-email=${targetEmail}`;

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

type DemoProject = {
  name: string;
  description: string;
  technologies: { name: string; version?: string }[];
  commands: {
    title: string;
    command: string;
    description: string;
    executionOrder: number;
  }[];
  resources: {
    label: string;
    url: string;
    type: 'DOCUMENTATION' | 'REPOSITORY';
  }[];
};

type DemoEntry = {
  projectName: string;
  title: string;
  type: 'ISSUE' | 'LEARNING';
  context: string;
  tags: string[];
  createdDaysAgo: number;
  conclusion?: string;
  resolvedDaysAgo?: number;
  attempts?: {
    description: string;
    result: 'FAILED' | 'PARTIAL' | 'SUCCESSFUL';
  }[];
};

const projects: DemoProject[] = [
  {
    name: 'DevLog Journal',
    description:
      'A technical journal for tracking project context, debugging notes, and lessons learned.',
    technologies: [
      { name: 'NestJS', version: '11' },
      { name: 'React', version: '19' },
      { name: 'Prisma', version: '7' },
      { name: 'PostgreSQL', version: '17' },
    ],
    commands: [
      {
        title: 'Start the workspace',
        command: 'pnpm dev',
        description: 'Run the API and web app in development mode.',
        executionOrder: 1,
      },
      {
        title: 'Apply API migrations',
        command: 'pnpm --filter api exec prisma migrate deploy',
        description: 'Bring the local database schema up to date.',
        executionOrder: 2,
      },
    ],
    resources: [
      {
        label: 'Prisma transactions',
        url: 'https://www.prisma.io/docs/orm/prisma-client/queries/transactions',
        type: 'DOCUMENTATION',
      },
      {
        label: 'NestJS documentation',
        url: 'https://docs.nestjs.com/',
        type: 'DOCUMENTATION',
      },
    ],
  },
  {
    name: 'TaskFlow API',
    description:
      'A small team task API focused on clear ownership rules and reliable activity history.',
    technologies: [
      { name: 'NestJS', version: '11' },
      { name: 'TypeScript', version: '5' },
      { name: 'PostgreSQL', version: '17' },
    ],
    commands: [
      {
        title: 'Run API unit tests',
        command: 'pnpm --filter api test',
        description: 'Check isolated application and domain behavior.',
        executionOrder: 1,
      },
      {
        title: 'Inspect database changes',
        command: 'pnpm --filter api exec prisma migrate status',
        description: 'Review which migrations have been applied.',
        executionOrder: 2,
      },
    ],
    resources: [
      {
        label: 'PostgreSQL indexes',
        url: 'https://www.postgresql.org/docs/current/indexes.html',
        type: 'DOCUMENTATION',
      },
    ],
  },
  {
    name: 'Pixel Pantry',
    description:
      'A responsive recipe organizer used to practice accessible forms and client-side caching.',
    technologies: [
      { name: 'React', version: '19' },
      { name: 'Vite', version: '7' },
      { name: 'TypeScript', version: '5' },
    ],
    commands: [
      {
        title: 'Start the frontend',
        command: 'pnpm --filter web dev',
        description: 'Start Vite with hot module replacement.',
        executionOrder: 1,
      },
      {
        title: 'Build for production',
        command: 'pnpm --filter web build',
        description: 'Create the optimized static bundle.',
        executionOrder: 2,
      },
    ],
    resources: [
      {
        label: 'React documentation',
        url: 'https://react.dev/learn',
        type: 'DOCUMENTATION',
      },
      {
        label: 'Vite guide',
        url: 'https://vite.dev/guide/',
        type: 'DOCUMENTATION',
      },
    ],
  },
];

const entries: DemoEntry[] = [
  {
    projectName: 'DevLog Journal',
    title: 'Prisma adapter was missing from the standalone script',
    type: 'ISSUE',
    context:
      'The API connects through Prisma 7 with the PostgreSQL driver adapter. A one-off maintenance script used the generated client without that adapter and failed before opening a database connection.',
    conclusion:
      'Create the Prisma client with PrismaPg and the same DATABASE_URL configuration used by the API service.',
    resolvedDaysAgo: 2,
    createdDaysAgo: 5,
    tags: ['Prisma', 'PostgreSQL', 'Debugging'],
    attempts: [
      {
        description:
          'Tried constructing PrismaClient with only the connection URL; Prisma 7 still required an adapter.',
        result: 'FAILED',
      },
      {
        description:
          'Passed a PrismaPg adapter to PrismaClient and loaded the local environment file before connecting.',
        result: 'SUCCESSFUL',
      },
    ],
  },
  {
    projectName: 'DevLog Journal',
    title: 'Keep multi-step writes inside one database transaction',
    type: 'LEARNING',
    context:
      'Creating a project together with technologies and useful commands spans several tables. If one later insert fails, earlier writes should not leave behind an incomplete project.',
    createdDaysAgo: 7,
    tags: ['Prisma', 'PostgreSQL', 'Architecture'],
  },
  {
    projectName: 'DevLog Journal',
    title: 'Archived projects should not accept new entries',
    type: 'ISSUE',
    context:
      'The project page correctly hid edit controls after archiving, but the API still accepted a request to create an entry under that project.',
    createdDaysAgo: 1,
    tags: ['NestJS', 'Validation', 'Testing'],
    attempts: [
      {
        description:
          'Added an ownership and lifecycle check to the use case before persisting the entry.',
        result: 'PARTIAL',
      },
    ],
  },
  {
    projectName: 'DevLog Journal',
    title: 'Use stable query keys for entry detail caches',
    type: 'LEARNING',
    context:
      'TanStack Query invalidation is easier to reason about when list, detail, and project-specific queries share a common key prefix.',
    createdDaysAgo: 12,
    tags: ['React', 'Caching', 'Architecture'],
  },
  {
    projectName: 'TaskFlow API',
    title: 'Project totals stayed stale after deleting a task',
    type: 'ISSUE',
    context:
      'The detail screen showed an old task count after deletion because the mutation invalidated the task list but not the project summary query.',
    conclusion:
      'Invalidating the shared project query prefix refreshes both the task list and the overview metrics.',
    resolvedDaysAgo: 4,
    createdDaysAgo: 6,
    tags: ['React', 'Caching', 'Debugging'],
    attempts: [
      {
        description:
          'Refetched the task list only; the summary card still displayed its cached total.',
        result: 'FAILED',
      },
      {
        description:
          'Invalidated the project detail query family after the delete mutation succeeds.',
        result: 'SUCCESSFUL',
      },
    ],
  },
  {
    projectName: 'TaskFlow API',
    title: 'Validate ownership before loading a nested resource',
    type: 'LEARNING',
    context:
      'A nested route such as projects/:projectId/tasks should verify that the authenticated user owns the project before returning its child records.',
    createdDaysAgo: 9,
    tags: ['NestJS', 'Security', 'Architecture'],
  },
  {
    projectName: 'TaskFlow API',
    title: 'Integration test database was not isolated from local data',
    type: 'ISSUE',
    context:
      'A test helper loaded the default environment file when NODE_ENV was unset, which could direct integration tests at the development database.',
    conclusion:
      'Set NODE_ENV=test in the integration command and load the test environment explicitly in the helper.',
    resolvedDaysAgo: 10,
    createdDaysAgo: 11,
    tags: ['Testing', 'PostgreSQL', 'Configuration'],
    attempts: [
      {
        description:
          'Moved the integration suite to its dedicated database URL and verified the selected port.',
        result: 'SUCCESSFUL',
      },
    ],
  },
  {
    projectName: 'Pixel Pantry',
    title: 'Form errors were not announced to screen readers',
    type: 'ISSUE',
    context:
      'Invalid recipe submissions showed red helper text visually, but the input did not reference the message and the error was not announced after submit.',
    createdDaysAgo: 3,
    tags: ['Accessibility', 'React', 'Forms'],
    attempts: [
      {
        description:
          'Connected each field to its message with aria-describedby and focused the first invalid field.',
        result: 'PARTIAL',
      },
    ],
  },
  {
    projectName: 'Pixel Pantry',
    title: 'Keep server data in the query cache instead of component state',
    type: 'LEARNING',
    context:
      'A recipe list fetched from the API has loading, error, and stale states. Letting the query library own this server state avoids duplicating those transitions in local component state.',
    createdDaysAgo: 8,
    tags: ['React', 'Caching', 'Architecture'],
  },
  {
    projectName: 'Pixel Pantry',
    title: 'Vite development proxy hid a missing API prefix',
    type: 'ISSUE',
    context:
      'Requests succeeded locally because the development proxy rewrote the path, while the production API expected the /api prefix.',
    conclusion:
      'Use the shared API base URL configuration in both environments and keep the proxy rewrite aligned with that contract.',
    resolvedDaysAgo: 15,
    createdDaysAgo: 16,
    tags: ['Vite', 'Configuration', 'Debugging'],
    attempts: [
      {
        description:
          'Compared the browser network request with the production controller route and aligned the base path.',
        result: 'SUCCESSFUL',
      },
    ],
  },
];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function assertSafeTarget(): string {
  if (!process.argv.includes(confirmation)) {
    throw new Error(
      `Refusing to continue. Pass the exact confirmation flag: ${confirmation}`,
    );
  }

  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'This sample-data script only runs with NODE_ENV=development.',
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required in apps/api/.env.');
  }

  const databaseUrl = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }

  if (
    !['localhost', '127.0.0.1', '::1', '[::1]'].includes(databaseUrl.hostname)
  ) {
    throw new Error(
      `Refusing to write to non-local database host: ${databaseUrl.hostname}`,
    );
  }

  return connectionString;
}

async function main(): Promise<void> {
  const connectionString = assertSafeTarget();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error(
        `No account found for ${targetEmail}. Create the account before seeding demo data.`,
      );
    }

    console.info(
      `Replacing demo data for ${targetEmail} in the local database.`,
    );

    await prisma.$transaction(
      async (transaction) => {
        const ownedProjects = await transaction.project.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        const foreignEntryCount = await transaction.technicalEntry.count({
          where: {
            userId: { not: user.id },
            projectId: { in: ownedProjects.map((project) => project.id) },
          },
        });
        if (foreignEntryCount > 0) {
          throw new Error(
            'A different account has entries linked to this user’s projects. No data was changed.',
          );
        }

        // Delete entries first so their attempts and tag links cascade cleanly;
        // deleting projects then cascades their technologies, commands, and resources.
        await transaction.technicalEntry.deleteMany({
          where: { userId: user.id },
        });
        await transaction.project.deleteMany({ where: { userId: user.id } });
        await transaction.tag.deleteMany({ where: { userId: user.id } });

        const projectIds = new Map<string, string>();
        for (const project of projects) {
          const created = await transaction.project.create({
            data: {
              userId: user.id,
              name: project.name,
              description: project.description,
            },
          });
          projectIds.set(project.name, created.id);

          await transaction.projectTechnology.createMany({
            data: project.technologies.map((technology) => ({
              projectId: created.id,
              ...technology,
            })),
          });
          await transaction.projectCommand.createMany({
            data: project.commands.map((command) => ({
              projectId: created.id,
              ...command,
            })),
          });
          await transaction.projectResource.createMany({
            data: project.resources.map((resource) => ({
              projectId: created.id,
              ...resource,
            })),
          });
        }

        const tagNames = [...new Set(entries.flatMap((entry) => entry.tags))];
        await transaction.tag.createMany({
          data: tagNames.map((name) => ({
            userId: user.id,
            name,
            normalizedName: name.toLocaleLowerCase('en-US'),
          })),
        });
        const tags = await transaction.tag.findMany({
          where: { userId: user.id },
        });
        const tagIds = new Map(tags.map((tag) => [tag.name, tag.id]));

        for (const entry of entries) {
          const createdAt = daysAgo(entry.createdDaysAgo);
          const resolvedAt = entry.resolvedDaysAgo
            ? daysAgo(entry.resolvedDaysAgo)
            : undefined;
          const created = await transaction.technicalEntry.create({
            data: {
              userId: user.id,
              projectId: projectIds.get(entry.projectName),
              title: entry.title,
              type: entry.type,
              context: entry.context,
              conclusion: entry.conclusion,
              createdAt,
              updatedAt: resolvedAt ?? createdAt,
              resolvedAt,
            },
          });

          await transaction.technicalEntryTag.createMany({
            data: entry.tags.map((name) => ({
              technicalEntryId: created.id,
              tagId: tagIds.get(name)!,
            })),
          });

          if (entry.attempts?.length) {
            await transaction.solutionAttempt.createMany({
              data: entry.attempts.map((attempt, index) => {
                const createdAt = new Date(
                  daysAgo(entry.createdDaysAgo).getTime() +
                    (index + 1) * 60 * 60 * 1000,
                );
                return {
                  technicalEntryId: created.id,
                  ...attempt,
                  createdAt,
                  updatedAt: createdAt,
                };
              }),
            });
          }
        }
      },
      { timeout: 30_000 },
    );

    console.info(
      `Created ${projects.length} projects, ${entries.length} entries, and ${new Set(entries.flatMap((entry) => entry.tags)).size} tags for ${targetEmail}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
