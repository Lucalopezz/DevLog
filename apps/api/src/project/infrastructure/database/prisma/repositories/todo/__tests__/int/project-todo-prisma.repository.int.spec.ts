import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';
import { ProjectPrismaRepository } from '@/project/infrastructure/database/prisma/repositories/project/project-prisma.repository';
import { createIntegrationPrisma } from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectTodoPrismaRepository } from '../../project-todo-prisma.repository';

const userId = '123e4567-e89b-42d3-a456-426614174300';
const projectId = '123e4567-e89b-42d3-a456-426614174301';
const createdAt = new Date('2026-01-01T00:00:00.000Z');

describe('ProjectTodoPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: ProjectTodoPrismaRepository;
  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new ProjectTodoPrismaRepository(prisma);
  });
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await new UserPrismaRepository(prisma).insert(
      new UserEntity(
        {
          name: 'Todo owner',
          email: 'todo-owner@example.com',
          password: 'hashed-password',
        },
        userId,
      ),
    );
    await new ProjectPrismaRepository(prisma).insert(
      new ProjectEntity(
        {
          userId,
          name: 'Todo project',
          status: ProjectStatusEnum.ACTIVE,
        },
        projectId,
      ),
    );
  });
  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
  });

  it('persists duplicates, sorts open-first across pages, and cascades project deletion', async () => {
    const completed = new ProjectTodoEntity(
      { projectId, title: 'Same title', createdAt },
      '123e4567-e89b-42d3-a456-426614174304',
    );
    const firstOpen = new ProjectTodoEntity(
      { projectId, title: 'Same title', createdAt },
      '123e4567-e89b-42d3-a456-426614174302',
    );
    const secondOpen = new ProjectTodoEntity(
      { projectId, title: 'Same title', createdAt },
      '123e4567-e89b-42d3-a456-426614174303',
    );
    completed.update({ completed: true });
    for (const entity of [completed, secondOpen, firstOpen])
      await repository.insert(entity);
    const first = await repository.search(projectId, 1, 2);
    const second = await repository.search(projectId, 2, 2);
    expect([...first.items, ...second.items].map((item) => item.id)).toEqual([
      firstOpen.id,
      secondOpen.id,
      completed.id,
    ]);
    expect(second.total).toBe(3);
    await prisma.project.delete({ where: { id: projectId } });
    expect(await repository.findById(firstOpen.id)).toBeNull();
  });
});
