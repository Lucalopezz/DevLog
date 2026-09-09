import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import type { SolutionAttemptOutput } from '@/technical-entry/application/dto/solution-attempt/solution-attempt.dto';
import type { ListSolutionAttemptsUseCaseOutput } from '@/technical-entry/application/usecases/solution-attempt/list-solution-attempts.usecase';

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

  // Separate output items from the remaining pagination properties
  // Pass the remaining pagination properties to the parent class constructor (CollectionPresenter)
  // Map items to SolutionAttemptPresenter and assign them to the data property
  constructor(output: ListSolutionAttemptsUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new SolutionAttemptPresenter(item));
  }
}
