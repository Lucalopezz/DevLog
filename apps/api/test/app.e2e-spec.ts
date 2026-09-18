import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ACCESS_TOKEN_COOKIE } from '@/auth/infrastructure/constants/auth.constants';
import { applyGlobalConfig } from '@/global-config';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';
import {
  ProjectResourceType,
  ProjectStatus,
  TechnicalEntryType,
} from '@generated/prisma/client';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174002';
const TAG_ID = '123e4567-e89b-42d3-a456-426614174003';
const AUTH_COOKIE = `${ACCESS_TOKEN_COOKIE}=e2e-token`;

type ProjectResponse = {
  archivedAt?: string;
  technologies?: Array<{ name: string; version?: string }>;
};

type CollectionResponse = {
  data: Array<Record<string, unknown>>;
};

describe('Project archive relationships (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('TokenProvider')
      .useValue({ verify: jest.fn().mockResolvedValue({ sub: USER_ID }) })
      .compile();

    app = moduleFixture.createNestApplication();
    applyGlobalConfig(app, {
      getCorsAllowedOrigins: () => [],
    } as EnvConfigService);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({ where: { id: USER_ID } });
    await prisma.user.create({
      data: {
        id: USER_ID,
        name: 'E2E user',
        email: 'archive-relations-e2e@example.com',
        passwordHash: 'not-used-in-this-test',
        tags: {
          create: {
            id: TAG_ID,
            name: 'Database',
            normalizedName: 'database',
          },
        },
        projects: {
          create: {
            id: PROJECT_ID,
            name: 'DevLog E2E',
            status: ProjectStatus.ACTIVE,
            technologies: {
              create: { name: 'NestJS', version: '11' },
            },
            commands: {
              create: { title: 'Start API', command: 'pnpm dev' },
            },
            resources: {
              create: {
                label: 'Documentation',
                url: 'https://example.com/docs',
                type: ProjectResourceType.DOCUMENTATION,
              },
            },
            entries: {
              create: {
                id: ENTRY_ID,
                userId: USER_ID,
                title: 'Preserved entry',
                context: 'Technical context',
                type: TechnicalEntryType.ISSUE,
              },
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { id: USER_ID } });
    }
    if (app) {
      await app.close();
    }
  });

  it('preserves technologies, commands, resources, and entries after archiving', async () => {
    const archiveResponse = await request(app.getHttpServer())
      .patch(`/api/project/${PROJECT_ID}/archive`)
      .set('Cookie', AUTH_COOKIE)
      .expect(200);

    const archiveBody = archiveResponse.body as ProjectResponse;

    expect(archiveBody).toMatchObject({
      id: PROJECT_ID,
      status: 'ACTIVE',
    });
    expect(archiveBody.archivedAt).toBeDefined();

    const [project, commands, resources, entries] = await Promise.all([
      request(app.getHttpServer())
        .get(`/api/project/${PROJECT_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .expect(200),
      request(app.getHttpServer())
        .get(`/api/project/${PROJECT_ID}/commands`)
        .set('Cookie', AUTH_COOKIE)
        .expect(200),
      request(app.getHttpServer())
        .get(`/api/project/${PROJECT_ID}/resources`)
        .set('Cookie', AUTH_COOKIE)
        .expect(200),
      request(app.getHttpServer())
        .get(`/api/project/${PROJECT_ID}/technical-entries`)
        .set('Cookie', AUTH_COOKIE)
        .expect(200),
    ]);

    const projectBody = project.body as ProjectResponse;
    const commandBody = commands.body as CollectionResponse;
    const resourceBody = resources.body as CollectionResponse;
    const entryBody = entries.body as CollectionResponse;

    expect(projectBody.technologies).toEqual([
      expect.objectContaining({ name: 'NestJS', version: '11' }),
    ]);
    expect(commandBody.data).toEqual([
      expect.objectContaining({ title: 'Start API' }),
    ]);
    expect(resourceBody.data).toEqual([
      expect.objectContaining({ label: 'Documentation' }),
    ]);
    expect(entryBody.data).toEqual([
      expect.objectContaining({
        projectId: PROJECT_ID,
        title: 'Preserved entry',
      }),
    ]);
  });

  it('rejects a duplicate project name for the same authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/project')
      .set('Cookie', AUTH_COOKIE)
      .send({ name: 'DevLog E2E' })
      .expect(409);

    expect(response.body).toMatchObject({
      statusCode: 409,
      message: 'Project with this name already exists for this user',
      error: 'Conflict',
    });
  });

  it('filters technical entries by tag over HTTP', async () => {
    await prisma.technicalEntryTag.create({
      data: {
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/technical-entry?tagId=${TAG_ID}`)
      .set('Cookie', AUTH_COOKIE)
      .expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: ENTRY_ID,
        title: 'Preserved entry',
        tags: [expect.objectContaining({ id: TAG_ID, name: 'Database' })],
      }),
    ]);
  });
});
