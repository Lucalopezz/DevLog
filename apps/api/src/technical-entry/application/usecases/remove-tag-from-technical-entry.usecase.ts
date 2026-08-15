import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/technical-entry-tag.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';

export type RemoveTagFromTechnicalEntryInput = {
  technicalEntryId: string;
  userId: string;
  tagId: string;
};

export type RemoveTagFromTechnicalEntryOutput = void;

export class RemoveTagFromTechnicalEntryUseCase implements UseCaseContract<
  RemoveTagFromTechnicalEntryInput,
  RemoveTagFromTechnicalEntryOutput
> {
  constructor(
    private readonly entryRepository: TechnicalEntryRepository,
    private readonly tagRepository: TagRepository,
    private readonly entryTagRepository: TechnicalEntryTagRepository,
  ) {}

  async execute(input: RemoveTagFromTechnicalEntryInput): Promise<void> {
    const { technicalEntryId, userId, tagId } = input;

    const entry = await this.entryRepository.findById(technicalEntryId);

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(
        'Technical entry not found or does not belong to the user.',
      );
    }

    const tag = await this.tagRepository.findById(tagId);

    if (!tag || tag.userId !== userId) {
      throw new NotFoundException('Tag não encontrada');
    }

    const isAssigned = await this.entryTagRepository.exists({
      technicalEntryId,
      tagId,
    });

    if (!isAssigned) {
      return;
    }

    await this.entryTagRepository.remove({
      technicalEntryId,
      tagId,
    });
  }
}
