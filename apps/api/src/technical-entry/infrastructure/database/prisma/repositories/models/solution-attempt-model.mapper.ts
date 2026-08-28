import { ValidationError } from '@/shared/domain/errors/validation-error';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import {
  SolutionAttemptResult as PrismaSolutionAttemptResult,
  type SolutionAttempt,
} from '@generated/prisma/client';

export class SolutionAttemptModelMapper {
  static toEntity(model: SolutionAttempt): SolutionAttemptEntity {
    const data = {
      technicalEntryId: model.technicalEntryId,
      description: model.description,
      result: this.toDomainResult(model.result),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new SolutionAttemptEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }
  static toPersistence(entity: SolutionAttemptEntity) {
    return {
      id: entity.id,
      technicalEntryId: entity.technicalEntryId,
      description: entity.description,
      result: this.toPrismaResult(entity.result),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static toDomainResult(
    result: PrismaSolutionAttemptResult,
  ): SolutionAttemptResult {
    switch (result) {
      case PrismaSolutionAttemptResult.FAILED:
        return SolutionAttemptResult.FAILED;
      case PrismaSolutionAttemptResult.PARTIAL:
        return SolutionAttemptResult.PARTIAL;
      case PrismaSolutionAttemptResult.SUCCESSFUL:
        return SolutionAttemptResult.SUCCESSFUL;
      default:
        throw new ValidationError('Invalid solution attempt result');
    }
  }

  // Mapeia o result para o tipo do Prisma, usado no toPersistence e no update do repositório
  static toPrismaResult(
    result: SolutionAttemptResult,
  ): PrismaSolutionAttemptResult {
    switch (result) {
      case SolutionAttemptResult.FAILED:
        return PrismaSolutionAttemptResult.FAILED;
      case SolutionAttemptResult.PARTIAL:
        return PrismaSolutionAttemptResult.PARTIAL;
      case SolutionAttemptResult.SUCCESSFUL:
        return PrismaSolutionAttemptResult.SUCCESSFUL;
      default:
        throw new ValidationError('Invalid solution attempt result');
    }
  }
}
