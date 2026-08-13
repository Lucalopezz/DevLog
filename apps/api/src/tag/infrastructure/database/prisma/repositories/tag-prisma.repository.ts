import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import {
  TagFilter,
  TagRepository,
  TagSearchParams,
  TagSearchResult,
} from '@/tag/domain/repositories/tag.repository';
import { TagModelMapper } from './models/tag-model.mapper';
import { Prisma } from '@generated/prisma/client';

export class TagPrismaRepository implements TagRepository {
  sortableFields: string[] = ['name', 'createdAt', 'updatedAt'];

  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: TagEntity): Promise<void> {
    await this.prismaService.tag.create({
      data: entity.toJSON(),
    });
  }

  async search(props: TagSearchParams): Promise<TagSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.tag.count({ where }),
      this.prismaService.tag.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new TagSearchResult({
      items: models.map((model) => TagModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }
  private _buildOrderBy(
    props: TagSearchParams,
  ): Prisma.TagOrderByWithRelationInput {
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }

  private _buildWhere(filter: TagFilter | null): Prisma.TagWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.TagWhereInput = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.name) {
      where.name = { contains: filter.name, mode: 'insensitive' };
    }

    return where;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.tag.delete({ where: { id } });
  }

  async findByNormalizedName(
    normalizedName: string,
    userId: string,
  ): Promise<TagEntity | null> {
    const model = await this.prismaService.tag.findFirst({
      where: { normalizedName, userId },
    });
    return model ? TagModelMapper.toEntity(model) : null;
  }

  async findAll(): Promise<TagEntity[]> {
    const models = await this.prismaService.tag.findMany();
    return models.map((model) => TagModelMapper.toEntity(model));
  }

  async findById(id: string): Promise<TagEntity | null> {
    const model = await this.prismaService.tag.findUnique({ where: { id } });
    return model ? TagModelMapper.toEntity(model) : null;
  }
  async update(entity: TagEntity): Promise<void> {
    return this.prismaService.tag
      .update({
        where: { id: entity.id },
        data: entity.toJSON(),
      })
      .then(() => {});
  }
}
