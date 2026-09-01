import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import {
  ProjectFilter,
  ProjectRepository,
  ProjectSearchParams,
  ProjectSearchResult,
} from '@/project/domain/repositories/project/project.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { Prisma } from '@generated/prisma/client';
import { ProjectModelMapper } from './models/project-model.mapper';

export class ProjectPrismaRepository implements ProjectRepository {
  sortableFields: string[] = ['createdAt', 'updatedAt', 'name'];

  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: ProjectEntity): Promise<void> {
    await this.prismaService.project.create({
      data: ProjectModelMapper.toPersistence(entity),
    });
  }

  async search(props: ProjectSearchParams): Promise<ProjectSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.project.count({ where }),
      this.prismaService.project.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new ProjectSearchResult({
      items: models.map((model) => ProjectModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const model = await this.prismaService.project.findUnique({
      where: { id },
    });
    return model ? ProjectModelMapper.toEntity(model) : null;
  }

  async findAll(): Promise<ProjectEntity[]> {
    const models = await this.prismaService.project.findMany();
    return models.map((model) => ProjectModelMapper.toEntity(model));
  }

  async findByOwnerId(userId: string): Promise<ProjectEntity[]> {
    const models = await this.prismaService.project.findMany({
      where: { userId },
    });
    return models.map((model) => ProjectModelMapper.toEntity(model));
  }

  async update(entity: ProjectEntity): Promise<void> {
    await this.prismaService.project.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        description: entity.description,
        status: ProjectModelMapper.toPrismaStatus(entity.status),
        localPath: entity.localPath ?? null,
        archivedAt: entity.archivedAt ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.project.delete({ where: { id } });
  }

  private _buildWhere(filter: ProjectFilter | null): Prisma.ProjectWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.ProjectWhereInput = {};

    if (filter.userId !== undefined) {
      where.userId = filter.userId;
    }
    if (filter.name) {
      where.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.archivedAt !== undefined) {
      where.archivedAt = filter.archivedAt;
    }
    if (filter.status !== undefined) {
      where.status = ProjectModelMapper.toPrismaStatus(filter.status);
    }

    return where;
  }

  private _buildOrderBy(
    props: ProjectSearchParams,
  ): Prisma.ProjectOrderByWithRelationInput {
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }
}
