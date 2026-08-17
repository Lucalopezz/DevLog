import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/testing/integration-test-helpers';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagPrismaRepository } from '@/tag/infrastructure/database/prisma/repositories/tag-prisma.repository';
import { TagSearchParams } from '@/tag/domain/repositories/tag.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const TAG_ID = '123e4567-e89b-42d3-a456-426614174020';
const OTHER_TAG_ID = '123e4567-e89b-42d3-a456-426614174021';

describe('TagPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: TagPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new TagPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lista somente tags do usuário e preserva a tag após consulta', async () => {
    await prisma.user.createMany({
      data: [
        {
          id: USER_ID,
          name: 'Tag Owner',
          email: 'tag-owner@example.com',
          passwordHash: 'hashed-password',
        },
        {
          id: OTHER_USER_ID,
          name: 'Other Owner',
          email: 'other-owner@example.com',
          passwordHash: 'hashed-password',
        },
      ],
    });
    await repository.insert(
      new TagEntity({ userId: USER_ID, name: 'NestJS' }, TAG_ID),
    );
    await repository.insert(
      new TagEntity({ userId: OTHER_USER_ID, name: 'Private' }, OTHER_TAG_ID),
    );

    const result = await repository.search(
      new TagSearchParams({
        page: 1,
        perPage: 10,
        filter: { userId: USER_ID },
      }),
    );

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: TAG_ID, name: 'NestJS' });
    await expect(repository.findById(TAG_ID)).resolves.toMatchObject({
      userId: USER_ID,
    });
  });
});
