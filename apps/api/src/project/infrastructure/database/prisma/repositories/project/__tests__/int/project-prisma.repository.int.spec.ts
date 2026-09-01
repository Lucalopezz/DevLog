import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectSearchParams } from '@/project/domain/repositories/project/project.repository';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectPrismaRepository } from '../../project-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const OTHER_PROJECT_ID = '123e4567-e89b-42d3-a456-426614174011';

function makeUser(id: string, suffix: string): UserEntity {
  return new UserEntity(
    {
      name: `User ${suffix}`,
      email: `${suffix}@example.com`,
      password: 'hashed-password',
    },
    id,
  );
}

function makeProject(id: string, userId: string, name: string): ProjectEntity {
  return new ProjectEntity(
    { userId, name, status: ProjectStatusEnum.ACTIVE },
    id,
  );
}

describe('ProjectPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let userRepository: UserPrismaRepository;
  let repository: ProjectPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    userRepository = new UserPrismaRepository(prisma);
    repository = new ProjectPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
    await userRepository.insert(makeUser(USER_ID, 'project-owner'));
    await userRepository.insert(makeUser(OTHER_USER_ID, 'project-other'));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste, filtra e atualiza um projeto sem vazar dados de outro usuário', async () => {
    const project = makeProject(PROJECT_ID, USER_ID, 'DevLog');
    await repository.insert(project);
    await repository.insert(
      makeProject(OTHER_PROJECT_ID, OTHER_USER_ID, 'Private project'),
    );

    const result = await repository.search(
      new ProjectSearchParams({
        filter: {
          userId: USER_ID,
          name: 'dev',
          status: ProjectStatusEnum.ACTIVE,
          archivedAt: null,
        },
      }),
    );

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: PROJECT_ID,
      userId: USER_ID,
      status: ProjectStatusEnum.ACTIVE,
    });

    project.update({ name: 'DevLog API', status: ProjectStatusEnum.INACTIVE });
    await repository.update(project);
    await expect(repository.findById(PROJECT_ID)).resolves.toMatchObject({
      name: 'DevLog API',
      status: ProjectStatusEnum.INACTIVE,
    });
  });
});
