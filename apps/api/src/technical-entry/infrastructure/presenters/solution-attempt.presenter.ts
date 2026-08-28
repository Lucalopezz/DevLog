import type { SolutionAttemptOutput } from '@/technical-entry/application/dto/solution-attempt.dto';

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
