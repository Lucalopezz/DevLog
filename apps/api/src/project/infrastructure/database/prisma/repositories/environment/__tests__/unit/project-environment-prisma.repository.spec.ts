import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentSearchParams } from '@/project/domain/repositories/environment/project-environment.repository';
import { ProjectEnvironmentPrismaRepository } from '../../project-environment-prisma.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

const projectId = '123e4567-e89b-42d3-a456-426614174002';
describe('ProjectEnvironmentPrismaRepository', () => {
  it('restricts the global query to the owner and maps records to entities', async () => {
    const count = jest.fn().mockResolvedValue(1);
    const findMany = jest.fn().mockResolvedValue([
      {
        id: '123e4567-e89b-42d3-a456-426614174003',
        projectId,
        name: 'Local',
        normalizedName: 'local',
        category: 'LOCAL',
        operatingSystem: null,
        runtime: null,
        runtimeVersion: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const repository = new ProjectEnvironmentPrismaRepository({
      projectEnvironment: { count, findMany },
    } as unknown as PrismaService);
    const result = await repository.search(
      new ProjectEnvironmentSearchParams({
        filter: {
          userId: 'owner',
          search: 'Node',
          category: ProjectEnvironmentCategory.LOCAL,
          projectId,
        },
        page: 2,
        perPage: 5,
        sort: 'name',
        sortDir: 'asc',
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: {
        project: { is: { userId: 'owner' } },
        projectId,
        category: 'LOCAL',
        OR: [
          { name: { contains: 'Node', mode: 'insensitive' } },
          { operatingSystem: { contains: 'Node', mode: 'insensitive' } },
          { runtime: { contains: 'Node', mode: 'insensitive' } },
        ],
      },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    );
    expect(result.items[0]).toBeInstanceOf(ProjectEnvironmentEntity);
    expect(result.items[0].name).toBe('Local');
  });

  it('sorts by project name through the project relation', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new ProjectEnvironmentPrismaRepository({
      projectEnvironment: { count, findMany },
    } as unknown as PrismaService);
    await repository.search(
      new ProjectEnvironmentSearchParams({
        filter: { userId: 'owner' },
        sort: 'projectName',
        sortDir: 'desc',
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ project: { name: 'desc' } }, { id: 'asc' }],
      }),
    );
  });
});
