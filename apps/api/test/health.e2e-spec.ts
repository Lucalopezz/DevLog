import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { applyGlobalConfig } from '@/global-config';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Both database provider tokens are used by the app. Replacing them lets
      // this HTTP liveness test run without a database connection.
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider('PrismaService')
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    applyGlobalConfig(app, {
      getCorsAllowedOrigins: () => [],
    } as EnvConfigService);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns an uncached health response without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({ status: 'ok' });
  });
});
