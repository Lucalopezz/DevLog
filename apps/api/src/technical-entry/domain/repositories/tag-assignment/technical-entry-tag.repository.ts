import { TagEntity } from '@/tag/domain/entities/tag.entity';

export type TechnicalEntryTagInput = {
  technicalEntryId: string;
  tagId: string;
};

export type FindTechnicalEntryTagsInput = {
  technicalEntryIds: string[];
  userId: string;
};

export interface TechnicalEntryTagRepository {
  add(input: TechnicalEntryTagInput): Promise<void>;

  remove(input: TechnicalEntryTagInput): Promise<void>;

  exists(input: TechnicalEntryTagInput): Promise<boolean>;

  findTags(
    input: FindTechnicalEntryTagsInput,
  ): Promise<Map<string, TagEntity[]>>;
}
