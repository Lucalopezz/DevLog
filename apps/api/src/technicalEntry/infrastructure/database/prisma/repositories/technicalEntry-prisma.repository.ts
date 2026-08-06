import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TechnicalEntryEntity } from '@/technicalEntry/domain/entities/technicalEntry.entity';
import {
  TechnicalEntryRepository,
  type TechnicalEntryFilter,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult,
} from '@/technicalEntry/domain/repositories/technicalEntry.repository';
import { SearchResult } from '@/shared/domain/repositories/searchable.repository';
import { Prisma } from '@generated/prisma/client';
import { TechnicalEntryModelMapper } from './models/technical-entry-model.mapper';

export class TechnicalEntryPrismaRepository implements TechnicalEntryRepository {
  sortableFields = [
    'createdAt',
    'updatedAt',
    'title',
    'type',
    'resolvedAt',
    'archivedAt',
  ];

  constructor(private readonly prismaService: PrismaService) {}

  async delete(id: string): Promise<void> {
    await this.prismaService.technicalEntry.delete({ where: { id } });
  }

  async findAll(): Promise<TechnicalEntryEntity[]> {
    const models = await this.prismaService.technicalEntry.findMany();
    return models.map((model) => TechnicalEntryModelMapper.toEntity(model));
  }

  async findById(id: string): Promise<TechnicalEntryEntity | null> {
    const model = await this.prismaService.technicalEntry.findUnique({
      where: { id },
    });
    return model ? TechnicalEntryModelMapper.toEntity(model) : null;
  }

  async findByOwnerId(userId: string): Promise<TechnicalEntryEntity[]> {
    const models = await this.prismaService.technicalEntry.findMany({
      where: { userId },
    });
    return models.map((model) => TechnicalEntryModelMapper.toEntity(model));
  }

  async insert(entity: TechnicalEntryEntity): Promise<void> {
    await this.prismaService.technicalEntry.create({
      data: TechnicalEntryModelMapper.toPersistence(entity),
    });
  }

  search(
    props: TechnicalEntrySearchParams,
  ): Promise<TechnicalEntrySearchResult> {
    return this._search(props);
  }

  async update(entity: TechnicalEntryEntity): Promise<void> {
    await this.prismaService.technicalEntry.update({
      where: { id: entity.id },
      data: {
        title: entity.title,
        context: entity.context,
        conclusion: entity.conclusion ?? null,
        type: TechnicalEntryModelMapper.toPrismaType(entity.type),
        resolvedAt: entity.resolvedAt,
        archivedAt: entity.archivedAt ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }

  private async _search(
    props: TechnicalEntrySearchParams,
  ): Promise<TechnicalEntrySearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.technicalEntry.count({ where }),
      this.prismaService.technicalEntry.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new SearchResult({
      items: models.map((model) => TechnicalEntryModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }

  private _buildWhere(
    filter: TechnicalEntryFilter | null,
  ): Prisma.TechnicalEntryWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.TechnicalEntryWhereInput = {};

    if (filter.userId !== undefined) {
      where.userId = filter.userId;
    }
    if (filter.projectId !== undefined) {
      where.projectId = filter.projectId;
    }
    if (filter.title) {
      where.title = { contains: filter.title, mode: 'insensitive' };
    }
    if (filter.type !== undefined) {
      where.type = TechnicalEntryModelMapper.toPrismaType(filter.type);
    }
    if (filter.archivedAt !== undefined) {
      where.archivedAt = filter.archivedAt;
    }

    return where;
  }

  private _buildOrderBy(
    props: TechnicalEntrySearchParams,
  ): Prisma.TechnicalEntryOrderByWithRelationInput {
    // Se o campo de ordenação for fornecido e estiver na lista de campos ordenáveis, use-o.
    // Caso contrário, ordene por createdAt em ordem decrescente.
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }
}
