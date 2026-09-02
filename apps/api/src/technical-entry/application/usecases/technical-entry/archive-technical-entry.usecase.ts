import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';

export type ArchiveTechnicalEntryUseCaseInput = {
  id: string;
  userId: string;
};

export type ArchiveTechnicalEntryUseCaseOutput = TechnicalEntryOutput;

export class ArchiveTechnicalEntryUseCase implements UseCaseContract<
  ArchiveTechnicalEntryUseCaseInput,
  ArchiveTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: ArchiveTechnicalEntryUseCaseInput,
  ): Promise<ArchiveTechnicalEntryUseCaseOutput> {
    const entry = await this.technicalEntryRepository.findById(input.id);

    if (entry === null || entry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    entry.archive();
    await this.technicalEntryRepository.update(entry);

    return TechnicalEntryOutputMapper.toOutput(entry);
  }
}
