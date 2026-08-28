import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import {
  SolutionAttemptFilter,
  SolutionAttemptRepository,
  SolutionAttemptSearchParams,
  SolutionAttemptSearchResult,
} from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repositoty';
import { Prisma } from '@generated/prisma/client';
import { SolutionAttemptModelMapper } from '../models/solution-attempt-model.mapper';

export class SolutionAttemptPrismaRepository implements SolutionAttemptRepository {
  sortableFields: string[] = ['createdAt', 'result'];

  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: SolutionAttemptEntity): Promise<void> {
    await this.prismaService.solutionAttempt.create({
      data: SolutionAttemptModelMapper.toPersistence(entity),
    });
  }

  async findAll(): Promise<SolutionAttemptEntity[]> {
    const models = await this.prismaService.solutionAttempt.findMany();
    return models.map((model) => SolutionAttemptModelMapper.toEntity(model));
  }

  async findById(id: string): Promise<SolutionAttemptEntity | null> {
    const model = await this.prismaService.solutionAttempt.findUnique({
      where: { id },
    });
    return model ? SolutionAttemptModelMapper.toEntity(model) : null;
  }

  async findByTechnicalEntryId(
    technicalEntryId: string,
  ): Promise<SolutionAttemptEntity[]> {
    const models = await this.prismaService.solutionAttempt.findMany({
      where: { technicalEntryId },
    });
    return models.map((model) => SolutionAttemptModelMapper.toEntity(model));
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.solutionAttempt.delete({ where: { id } });
  }

  async search(
    props: SolutionAttemptSearchParams,
  ): Promise<SolutionAttemptSearchResult> {
    const where = this._buildWhere(props.filter);
    const orderBy = this._buildOrderBy(props);
    // -1 por causa do offset começar em 0, e não em 1
    // Exemplo: página 1, perPage 10, skip = (1 - 1) * 10 = 0
    const skip = (props.page - 1) * props.perPage;

    const [total, models] = await Promise.all([
      this.prismaService.solutionAttempt.count({ where }),
      this.prismaService.solutionAttempt.findMany({
        where,
        orderBy,
        skip,
        take: props.perPage,
      }),
    ]);

    return new SolutionAttemptSearchResult({
      items: models.map((model) => SolutionAttemptModelMapper.toEntity(model)),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }

  async update(entity: SolutionAttemptEntity): Promise<void> {
    await this.prismaService.solutionAttempt.update({
      where: { id: entity.id },
      data: {
        description: entity.description,
        result: SolutionAttemptModelMapper.toPrismaResult(entity.result),
        updatedAt: entity.updatedAt,
      },
    });
  }

  private _buildWhere(
    filter: SolutionAttemptFilter | null,
  ): Prisma.SolutionAttemptWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.SolutionAttemptWhereInput = {};

    if (filter.result !== undefined) {
      where.result = SolutionAttemptModelMapper.toPrismaResult(filter.result);
    }

    if (filter.technicalEntryId !== undefined) {
      where.technicalEntryId = filter.technicalEntryId;
    }

    return where;
  }

  private _buildOrderBy(
    props: SolutionAttemptSearchParams,
  ): Prisma.SolutionAttemptOrderByWithRelationInput {
    if (props.sort && this.sortableFields.includes(props.sort)) {
      return { [props.sort]: props.sortDir ?? 'asc' };
    }

    return { createdAt: 'desc' };
  }
}
