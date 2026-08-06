import { ValidationError } from '@/shared/domain/errors/validation-error';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import {
  TechnicalEntryType as PrismaTechnicalEntryType,
  type TechnicalEntry,
} from '@generated/prisma/client';

export class TechnicalEntryModelMapper {
  static toEntity(model: TechnicalEntry): TechnicalEntryEntity {
    const type = this.toDomainType(model.type);
    const data = {
      userId: model.userId,
      projectId: model.projectId ?? undefined,
      title: model.title,
      context: model.context,
      conclusion: model.conclusion ?? undefined,
      type,
      resolvedAt: model.resolvedAt ?? undefined,
      archivedAt: model.archivedAt ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new TechnicalEntryEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }

  static toPersistence(entity: TechnicalEntryEntity) {
    return {
      id: entity.id,
      userId: entity.userId,
      projectId: entity.projectId ?? null,
      title: entity.title,
      context: entity.context,
      conclusion: entity.conclusion ?? null,
      type: this.toPrismaType(entity.type),
      resolvedAt: entity.resolvedAt ?? null,
      archivedAt: entity.archivedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static toDomainType(
    type: PrismaTechnicalEntryType,
  ): TechnicalEntryType {
    switch (type) {
      case PrismaTechnicalEntryType.ISSUE:
        return TechnicalEntryType.ISSUE;
      case PrismaTechnicalEntryType.LEARNING:
        return TechnicalEntryType.LEARNING;
    }
  }

  static toPrismaType(type: TechnicalEntryType): PrismaTechnicalEntryType {
    switch (type) {
      case TechnicalEntryType.ISSUE:
        return PrismaTechnicalEntryType.ISSUE;
      case TechnicalEntryType.LEARNING:
        return PrismaTechnicalEntryType.LEARNING;
      default:
        throw new Error('Invalid technical entry type');
    }
  }
}
