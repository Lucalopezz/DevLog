import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';

export type DeleteTagUseCaseInput = {
  id: string;
  userId: string;
};

export type DeleteTagUseCaseOutput = void;

export class DeleteTagUseCase implements UseCaseContract<
  DeleteTagUseCaseInput,
  DeleteTagUseCaseOutput
> {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: DeleteTagUseCaseInput): Promise<void> {
    const tag = await this.tagRepository.findById(input.id);

    if (tag === null || tag.userId !== input.userId) {
      throw new NotFoundException('Tag não encontrada');
    }

    await this.tagRepository.delete(input.id);
  }
}
