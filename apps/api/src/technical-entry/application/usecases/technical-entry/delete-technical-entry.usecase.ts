import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';

export type DeleteTechnicalEntryUseCaseInput = {
  id: string;
  userId: string;
};

export type DeleteTechnicalEntryUseCaseOutput = void;

export class DeleteTechnicalEntryUseCase implements UseCaseContract<
  DeleteTechnicalEntryUseCaseInput,
  DeleteTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(input: DeleteTechnicalEntryUseCaseInput): Promise<void> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.id,
    );

    if (technicalEntry === null || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    await this.technicalEntryRepository.delete(input.id);
  }
}
