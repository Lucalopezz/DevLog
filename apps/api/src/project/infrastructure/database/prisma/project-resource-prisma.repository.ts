import { ProjectResourceEntity } from '@/project/domain/entities/project-resource.entity';
import {
  type ProjectResourceFilter,
  type ProjectResourceRepository,
  ProjectResourceSearchParams,
  ProjectResourceSearchResult,
} from '@/project/domain/repositories/project-resource.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { Prisma } from '@generated/prisma/client';
import { ProjectResourceModelMapper } from './models/project-resource-model.mapper';

export class ProjectResourcePrismaRepository implements ProjectResourceRepository {
  sortableFields: string[] = ['label', 'type', 'createdAt', 'updatedAt'];

  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: ProjectResourceEntity): Promise<void> {
    await this.prismaService.projectResource.create({
      data: ProjectResourceModelMapper.toPersistence(entity),
    });
  }

  async findById(id: string): Promise<ProjectResourceEntity | null> {
    const model = await this.prismaService.projectResource.findUnique({
      where: { id },
    });

    return model ? ProjectResourceModelMapper.toEntity(model) : null;
  }

  async findAll(): Promise<ProjectResourceEntity[]> {
    const models = await this.prismaService.projectResource.findMany();
    return models.map((model) => ProjectResourceModelMapper.toEntity(model));
  }

  async update(entity: ProjectResourceEntity): Promise<void> {
    await this.prismaService.projectResource.update({
      where: { id: entity.id },
      data: {
        label: entity.label,
        url: entity.url,
        type: ProjectResourceModelMapper.toPrismaType(entity.type),
        updatedAt: entity.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.projectResource.delete({ where: { id } });
  }

  async search(
    props: ProjectResourceSearchParams,
  ): Promise<ProjectResourceSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.projectResource.count({ where }),
      this.prismaService.projectResource.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new ProjectResourceSearchResult({
      items: models.map((model) => ProjectResourceModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }

  private _buildWhere(
    filter: ProjectResourceFilter | null,
  ): Prisma.ProjectResourceWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.ProjectResourceWhereInput = {};

    if (filter.projectId !== undefined) {
      where.projectId = filter.projectId;
    }
    if (filter.label) {
      where.label = { contains: filter.label, mode: 'insensitive' };
    }
    if (filter.url) {
      where.url = { contains: filter.url, mode: 'insensitive' };
    }
    if (filter.type !== undefined) {
      where.type = ProjectResourceModelMapper.toPrismaType(filter.type);
    }

    return where;
  }

  private _buildOrderBy(
    props: ProjectResourceSearchParams,
  ): Prisma.ProjectResourceOrderByWithRelationInput {
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }
}
