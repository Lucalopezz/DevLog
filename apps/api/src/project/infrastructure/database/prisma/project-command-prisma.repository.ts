import { ProjectCommandEntity } from '@/project/domain/entities/project-command.entity';
import {
  ProjectCommandFilter,
  ProjectCommandRepository,
  ProjectCommandSearchParams,
  ProjectCommandSearchResult,
} from '@/project/domain/repositories/project-command.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectCommandModelMapper } from './models/project-command-model.mapper';
import { Prisma } from '@generated/prisma/client';

export class ProjectCommandPrismaRepository implements ProjectCommandRepository {
  sortableFields: string[] = [
    'title',
    'executionOrder',
    'createdAt',
    'updatedAt',
  ];

  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: ProjectCommandEntity): Promise<void> {
    await this.prismaService.projectCommand.create({
      data: ProjectCommandModelMapper.toPersistence(entity),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.projectCommand.delete({ where: { id } });
  }

  async findAll(): Promise<ProjectCommandEntity[]> {
    const models = await this.prismaService.projectCommand.findMany();
    return models.map((model) => ProjectCommandModelMapper.toEntity(model));
  }

  async findById(id: string): Promise<ProjectCommandEntity | null> {
    const model = await this.prismaService.projectCommand.findUnique({
      where: { id },
    });

    return model ? ProjectCommandModelMapper.toEntity(model) : null;
  }

  async update(entity: ProjectCommandEntity): Promise<void> {
    await this.prismaService.projectCommand.update({
      where: { id: entity.id },
      data: {
        title: entity.title,
        command: entity.command,
        description: entity.description ?? null,
        executionOrder: entity.executionOrder ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }

  async search(
    props: ProjectCommandSearchParams,
  ): Promise<ProjectCommandSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.projectCommand.count({ where }),
      this.prismaService.projectCommand.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new ProjectCommandSearchResult({
      items: models.map((model) => ProjectCommandModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }
  private _buildWhere(
    filter: ProjectCommandFilter | null,
  ): Prisma.ProjectCommandWhereInput {
    if (!filter) {
      return {};
    }
    const where: Prisma.ProjectCommandWhereInput = {};

    if (filter.projectId !== undefined) {
      where.projectId = filter.projectId;
    }

    if (filter.title) {
      where.title = { contains: filter.title, mode: 'insensitive' };
    }
    if (filter.command) {
      where.command = { contains: filter.command, mode: 'insensitive' };
    }
    if (filter.description) {
      where.description = {
        contains: filter.description,
        mode: 'insensitive',
      };
    }

    return where;
  }

  private _buildOrderBy(
    props: ProjectCommandSearchParams,
  ): Prisma.ProjectCommandOrderByWithRelationInput {
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }
}
