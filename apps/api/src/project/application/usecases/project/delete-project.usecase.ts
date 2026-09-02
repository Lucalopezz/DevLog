import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';

export type DeleteProjectUseCaseInput = {
  id: string;
  userId: string;
};

export type DeleteProjectUseCaseOutput = void;

export class DeleteProjectUseCase implements UseCaseContract<
  DeleteProjectUseCaseInput,
  DeleteProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: DeleteProjectUseCaseInput): Promise<void> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.ensureCanBeModified();

    await this.projectRepository.delete(input.id);
  }
}
