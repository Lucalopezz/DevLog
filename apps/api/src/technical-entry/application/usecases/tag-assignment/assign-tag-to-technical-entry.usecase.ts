import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/tag-assignment/technical-entry-tag.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { NotFoundException } from '@nestjs/common';
import { TagOutput, TagOutputMapper } from '@/tag/application/dto/tag.dto';

export type AssignTagToTechnicalEntryInput = {
  technicalEntryId: string;
  userId: string;
  tagId: string;
};

export type AssignTagToTechnicalEntryOutput = TagOutput;

export class AssignTagToTechnicalEntryUseCase implements UseCaseContract<
  AssignTagToTechnicalEntryInput,
  AssignTagToTechnicalEntryOutput
> {
  constructor(
    private readonly entryRepository: TechnicalEntryRepository,

    private readonly tagRepository: TagRepository,

    private readonly entryTagRepository: TechnicalEntryTagRepository,
  ) {}
  async execute(
    input: AssignTagToTechnicalEntryInput,
  ): Promise<AssignTagToTechnicalEntryOutput> {
    const { technicalEntryId, userId, tagId } = input;

    const entry = await this.entryRepository.findById(technicalEntryId);

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Technical entry not found');
    }
    const tag = await this.tagRepository.findById(input.tagId);

    if (!tag || tag.userId !== userId) {
      throw new NotFoundException('Tag not found');
    }

    const alreadyAssigned = await this.entryTagRepository.exists({
      technicalEntryId: technicalEntryId,
      tagId: tagId,
    });

    // For idempotency, return the tag without an error if it is already assigned to the entry.
    if (alreadyAssigned) {
      return TagOutputMapper.toOutput(tag);
    }

    await this.entryTagRepository.add({
      technicalEntryId: technicalEntryId,
      tagId: tagId,
    });

    return TagOutputMapper.toOutput(tag);
  }
}
