import { ValidationError } from '@/shared/domain/errors/validation-error';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { Tag } from '@generated/prisma/client';

export class TagModelMapper {
  static toEntity(model: Tag): TagEntity {
    const data = {
      name: model.name,
      userId: model.userId,
      normalizedName: model.normalizedName,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new TagEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }
}
