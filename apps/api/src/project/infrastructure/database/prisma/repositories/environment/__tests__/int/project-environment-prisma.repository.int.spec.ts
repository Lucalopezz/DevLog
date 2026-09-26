import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { ProjectEnvironmentSearchParams } from '@/project/domain/repositories/environment/project-environment.repository';
import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectPrismaRepository } from '@/project/infrastructure/database/prisma/repositories/project/project-prisma.repository';
import { createIntegrationPrisma } from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectEnvironmentPrismaRepository } from '../../project-environment-prisma.repository';

const userId = '123e4567-e89b-42d3-a456-426614174100';
const projectId = '123e4567-e89b-42d3-a456-426614174101';
const secondProjectId = '123e4567-e89b-42d3-a456-426614174102';

describe('ProjectEnvironmentPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: ProjectEnvironmentPrismaRepository;
  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new ProjectEnvironmentPrismaRepository(prisma);
  });
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await new UserPrismaRepository(prisma).insert(
      new UserEntity(
        {
          name: 'Environment owner',
          email: 'environment-owner@example.com',
          password: 'hashed-password',
        },
        userId,
      ),
    );
    const projects = new ProjectPrismaRepository(prisma);
    await projects.insert(
      new ProjectEntity(
        { userId, name: 'DevLog', status: ProjectStatusEnum.ACTIVE },
        projectId,
      ),
    );
    await projects.insert(
      new ProjectEntity(
        { userId, name: 'Second project', status: ProjectStatusEnum.ACTIVE },
        secondProjectId,
      ),
    );
  });
  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
  });
  it('persists fields, enforces scoped uniqueness, filters and cascades', async () => {
    const first = new ProjectEnvironmentEntity({
      projectId,
      name: ' Local ',
      category: ProjectEnvironmentCategory.LOCAL,
      operatingSystem: 'Ubuntu',
      runtime: 'Node.js',
      runtimeVersion: '22',
      description: 'Docker Compose',
    });
    await repository.insert(first);
    expect(await repository.findById(first.id)).toMatchObject({
      name: 'Local',
      normalizedName: 'local',
      runtimeVersion: '22',
    });
    await expect(
      repository.insert(
        new ProjectEnvironmentEntity({
          projectId,
          name: 'LOCAL',
          category: ProjectEnvironmentCategory.TESTING,
        }),
      ),
    ).rejects.toMatchObject({ code: 'P2002' });
    await repository.insert(
      new ProjectEnvironmentEntity({
        projectId: secondProjectId,
        name: 'local',
        category: ProjectEnvironmentCategory.LOCAL,
      }),
    );
    const result = await repository.search(
      new ProjectEnvironmentSearchParams({
        filter: {
          userId,
          search: 'ubuntu',
          category: ProjectEnvironmentCategory.LOCAL,
          projectId,
        },
        page: 1,
        perPage: 10,
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toBeInstanceOf(ProjectEnvironmentEntity);
    await prisma.project.delete({ where: { id: projectId } });
    expect(await repository.findById(first.id)).toBeNull();
  });
});
