import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeUser(): UserEntity {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new UserEntity(
    {
      name: 'Integration User',
      email: 'integration-user@example.com',
      password: 'hashed-password',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    USER_ID,
  );
}

describe('UserPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: UserPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new UserPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste, consulta e atualiza um usuário', async () => {
    const user = makeUser();
    await repository.insert(user);

    await expect(repository.findByEmail(user.email)).resolves.toMatchObject({
      id: USER_ID,
      email: user.email,
      password: user.password,
    });

    user.updateName('Updated User');
    await repository.update(user);

    await expect(repository.findById(USER_ID)).resolves.toMatchObject({
      name: 'Updated User',
    });
  });
});
