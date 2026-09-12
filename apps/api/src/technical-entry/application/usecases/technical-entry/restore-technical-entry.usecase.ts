import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';

export type RestoreTechnicalEntryUseCaseInput = {
  id: string;
  userId: string;
};

export type RestoreTechnicalEntryUseCaseOutput = TechnicalEntryOutput;

export class RestoreTechnicalEntryUseCase implements UseCaseContract<
  RestoreTechnicalEntryUseCaseInput,
  RestoreTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: RestoreTechnicalEntryUseCaseInput,
  ): Promise<RestoreTechnicalEntryUseCaseOutput> {
    const entry = await this.technicalEntryRepository.findById(input.id);

    if (entry === null || entry.userId !== input.userId) {
      throw new NotFoundException('Technical entry not found');
    }

    entry.restore();
    await this.technicalEntryRepository.update(entry);

    return TechnicalEntryOutputMapper.toOutput(entry);
  }
}
