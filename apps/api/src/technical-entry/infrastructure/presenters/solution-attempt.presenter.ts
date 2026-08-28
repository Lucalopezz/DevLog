import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import type { SolutionAttemptOutput } from '@/technical-entry/application/dto/solution-attempt.dto';
import type { ListSolutionAttemptsUseCaseOutput } from '@/technical-entry/application/usecases/list-solution-attempts.usecase';

export class SolutionAttemptPresenter {
  id: string;
  technicalEntryId: string;
  description: string;
  result: SolutionAttemptOutput['result'];
  createdAt: Date;
  updatedAt: Date;

  constructor(output: SolutionAttemptOutput) {
    this.id = output.id;
    this.technicalEntryId = output.technicalEntryId;
    this.description = output.description;
    this.result = output.result;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class SolutionAttemptCollectionPresenter extends CollectionPresenter<SolutionAttemptPresenter> {
  data: SolutionAttemptPresenter[];

  // Separando os itens do output e o resto das propriedades de paginação
  // O resto das propriedades de paginação são passadas para o construtor da classe pai (CollectionPresenter)
  // Os itens são mapeados para a classe SolutionAttemptPresenter e atribuídos à propriedade data
  constructor(output: ListSolutionAttemptsUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new SolutionAttemptPresenter(item));
  }
}
