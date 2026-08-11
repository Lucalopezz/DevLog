import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../dto/technical-entry.dto';

export type GetTechnicalEntryUseCaseInput = {
  id: string;
  userId: string;
};

export type GetTechnicalEntryUseCaseOutput = TechnicalEntryOutput;

export class GetTechnicalEntryUseCase implements UseCaseContract<
  GetTechnicalEntryUseCaseInput,
  GetTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: GetTechnicalEntryUseCaseInput,
  ): Promise<TechnicalEntryOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.id,
    );

    if (technicalEntry === null || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}
