import {
  Prisma,
  ProjectEnvironmentCategory as PrismaEnvironmentCategory,
} from '@generated/prisma/client';
import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import {
  ProjectEnvironmentFilter,
  ProjectEnvironmentRepository,
  ProjectEnvironmentSearchParams,
  ProjectEnvironmentSearchResult,
} from '@/project/domain/repositories/environment/project-environment.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectEnvironmentModelMapper } from './models/project-environment-model.mapper';

export class ProjectEnvironmentPrismaRepository implements ProjectEnvironmentRepository {
  sortableFields = [
    'name',
    'category',
    'createdAt',
    'updatedAt',
    'projectName',
  ];
  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: ProjectEnvironmentEntity): Promise<void> {
    await this.prismaService.projectEnvironment.create({
      data: ProjectEnvironmentModelMapper.toPersistence(entity),
    });
  }
  async findById(id: string): Promise<ProjectEnvironmentEntity | null> {
    const model = await this.prismaService.projectEnvironment.findUnique({
      where: { id },
    });
    return model ? ProjectEnvironmentModelMapper.toEntity(model) : null;
  }
  async findByNormalizedName(
    projectId: string,
    normalizedName: string,
  ): Promise<ProjectEnvironmentEntity | null> {
    const model = await this.prismaService.projectEnvironment.findUnique({
      where: { projectId_normalizedName: { projectId, normalizedName } },
    });
    return model ? ProjectEnvironmentModelMapper.toEntity(model) : null;
  }
  async findAll(): Promise<ProjectEnvironmentEntity[]> {
    const models = await this.prismaService.projectEnvironment.findMany();
    return models.map((model) => ProjectEnvironmentModelMapper.toEntity(model));
  }
  async update(entity: ProjectEnvironmentEntity): Promise<void> {
    await this.prismaService.projectEnvironment.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        normalizedName: entity.normalizedName,
        category: PrismaEnvironmentCategory[entity.category],
        operatingSystem: entity.operatingSystem ?? null,
        runtime: entity.runtime ?? null,
        runtimeVersion: entity.runtimeVersion ?? null,
        description: entity.description ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }
  async delete(id: string): Promise<void> {
    await this.prismaService.projectEnvironment.delete({ where: { id } });
  }
  async search(
    props: ProjectEnvironmentSearchParams,
  ): Promise<ProjectEnvironmentSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const [total, models] = await Promise.all([
      this.prismaService.projectEnvironment.count({ where }),
      this.prismaService.projectEnvironment.findMany({
        where,
        orderBy,
        skip: (props.page - 1) * props.perPage,
        take: props.perPage,
      }),
    ]);
    return new ProjectEnvironmentSearchResult({
      items: models.map((model) =>
        ProjectEnvironmentModelMapper.toEntity(model),
      ),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }

  private _buildWhere(
    filter: ProjectEnvironmentFilter | null,
  ): Prisma.ProjectEnvironmentWhereInput {
    if (!filter) return {};

    const where: Prisma.ProjectEnvironmentWhereInput = {};
    if (filter.projectId) where.projectId = filter.projectId;
    if (filter.userId) where.project = { is: { userId: filter.userId } };
    if (filter.category)
      where.category = PrismaEnvironmentCategory[filter.category];
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        {
          operatingSystem: { contains: filter.search, mode: 'insensitive' },
        },
        { runtime: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private _buildOrderBy(
    props: ProjectEnvironmentSearchParams,
  ): Prisma.ProjectEnvironmentOrderByWithRelationInput[] {
    if (props.sort === 'projectName') {
      return [{ project: { name: props.sortDir ?? 'asc' } }, { id: 'asc' }];
    }
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return [{ [props.sort]: props.sortDir ?? 'asc' }, { id: 'asc' }];
    }
    return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
}
