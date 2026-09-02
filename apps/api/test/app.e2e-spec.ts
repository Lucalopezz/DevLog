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
        name: 'Usuário E2E',
        email: 'archive-relations-e2e@example.com',
        passwordHash: 'not-used-in-this-test',
        projects: {
          create: {
            id: PROJECT_ID,
            name: 'DevLog E2E',
            status: ProjectStatus.ACTIVE,
            technologies: {
              create: { name: 'NestJS', version: '11' },
            },
            commands: {
              create: { title: 'Iniciar API', command: 'pnpm dev' },
            },
            resources: {
              create: {
                label: 'Documentação',
                url: 'https://example.com/docs',
                type: ProjectResourceType.DOCUMENTATION,
              },
            },
            entries: {
              create: {
                userId: USER_ID,
                title: 'Entrada preservada',
                context: 'Contexto técnico',
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

  it('preserva tecnologias, comandos, recursos e entradas após arquivar', async () => {
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
      expect.objectContaining({ title: 'Iniciar API' }),
    ]);
    expect(resourceBody.data).toEqual([
      expect.objectContaining({ label: 'Documentação' }),
    ]);
    expect(entryBody.data).toEqual([
      expect.objectContaining({
        projectId: PROJECT_ID,
        title: 'Entrada preservada',
      }),
    ]);
  });
});
