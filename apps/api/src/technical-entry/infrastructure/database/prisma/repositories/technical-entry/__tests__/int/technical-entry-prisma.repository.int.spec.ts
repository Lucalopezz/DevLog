import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry/technical-entry-status.enum';
import { TechnicalEntryPrismaRepository } from '@/technical-entry/infrastructure/database/prisma/repositories/technical-entry/technical-entry-prisma.repository';
import { TechnicalEntryTagPrismaRepository } from '@/technical-entry/infrastructure/database/prisma/repositories/tag-assignment/technical-entry-tag-prisma.repository';
import { TechnicalEntrySearchParams } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagPrismaRepository } from '@/tag/infrastructure/database/prisma/repositories/tag-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';
const RESOLVED_ENTRY_ID = '123e4567-e89b-42d3-a456-426614174011';
const OTHER_ENTRY_ID = '123e4567-e89b-42d3-a456-426614174012';
const TAG_ID = '123e4567-e89b-42d3-a456-426614174020';

function makeUser(id: string, suffix: string): UserEntity {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new UserEntity(
    {
      name: `User ${suffix}`,
      email: `${suffix}@example.com`,
      password: 'hashed-password',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    id,
  );
}

function makeEntry(
  id: string,
  userId: string,
  overrides: Partial<{
    title: string;
    type: TechnicalEntryType;
    resolvedAt: Date;
  }> = {},
): TechnicalEntryEntity {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new TechnicalEntryEntity(
    {
      userId,
      title: overrides.title ?? 'NestJS entry',
      context: 'Contexto persistido',
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      conclusion: overrides.resolvedAt ? 'Problema resolvido' : undefined,
      resolvedAt: overrides.resolvedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    id,
  );
}

describe('TechnicalEntryPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let userRepository: UserPrismaRepository;
  let entryRepository: TechnicalEntryPrismaRepository;
  let entryTagRepository: TechnicalEntryTagPrismaRepository;
  let tagRepository: TagPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    userRepository = new UserPrismaRepository(prisma);
    entryRepository = new TechnicalEntryPrismaRepository(prisma);
    entryTagRepository = new TechnicalEntryTagPrismaRepository(prisma);
    tagRepository = new TagPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('aplica status, texto e isolamento do usuário na busca', async () => {
    await userRepository.insert(makeUser(USER_ID, 'entry-owner'));
    await userRepository.insert(makeUser(OTHER_USER_ID, 'entry-other'));
    await entryRepository.insert(makeEntry(ENTRY_ID, USER_ID));
    await entryRepository.insert(
      makeEntry(RESOLVED_ENTRY_ID, USER_ID, {
        title: 'Resolved NestJS entry',
        resolvedAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    );
    await entryRepository.insert(
      makeEntry(OTHER_ENTRY_ID, OTHER_USER_ID, {
        title: 'Private NestJS entry',
      }),
    );

    const result = await entryRepository.search(
      new TechnicalEntrySearchParams({
        page: 1,
        perPage: 10,
        filter: {
          userId: USER_ID,
          title: 'NestJS',
          status: TechnicalEntryStatus.OPEN,
        },
      }),
    );

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: ENTRY_ID,
      userId: USER_ID,
      status: TechnicalEntryStatus.OPEN,
    });
  });

  it('persiste e remove a relação entre entrada e tag sem apagar a tag', async () => {
    await userRepository.insert(makeUser(USER_ID, 'relation-owner'));
    await entryRepository.insert(makeEntry(ENTRY_ID, USER_ID));
    await tagRepository.insert(
      new TagEntity({ userId: USER_ID, name: 'NestJS' }, TAG_ID),
    );

    await entryTagRepository.add({
      technicalEntryId: ENTRY_ID,
      tagId: TAG_ID,
    });
    await expect(
      entryTagRepository.exists({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
      }),
    ).resolves.toBe(true);

    const tagsByEntry = await entryTagRepository.findTags({
      technicalEntryIds: [ENTRY_ID],
      userId: USER_ID,
    });
    expect(tagsByEntry.get(ENTRY_ID)?.map((tag) => tag.id)).toEqual([TAG_ID]);

    await entryTagRepository.remove({
      technicalEntryId: ENTRY_ID,
      tagId: TAG_ID,
    });
    await expect(tagRepository.findById(TAG_ID)).resolves.toMatchObject({
      id: TAG_ID,
    });
    await expect(
      entryTagRepository.exists({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
      }),
    ).resolves.toBe(false);
  });
});
