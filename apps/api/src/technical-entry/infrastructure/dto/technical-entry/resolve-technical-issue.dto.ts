import type { ResolveTechnicalIssueUseCaseInput } from '@/technical-entry/application/usecases/technical-entry/resolve-technical-issue.usecase';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveTechnicalIssueDto implements Omit<
  ResolveTechnicalIssueUseCaseInput,
  'id' | 'userId'
> {
  @IsNotEmpty({ message: 'A conclusion is required to resolve the entry' })
  @IsString({ message: 'Conclusion must be a string' })
  conclusion: string;
}
