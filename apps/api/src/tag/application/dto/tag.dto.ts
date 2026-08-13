import { TagEntity } from '@/tag/domain/entities/tag.entity';

export type TagOutput = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export class TagOutputMapper {
  static toOutput(tag: TagEntity): TagOutput {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
