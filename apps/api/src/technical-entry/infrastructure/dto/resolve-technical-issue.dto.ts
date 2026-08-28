import type { ResolveTechnicalIssueUseCaseInput } from '@/technical-entry/application/usecases/resolve-technical-issue.usecase';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveTechnicalIssueDto implements Omit<
  ResolveTechnicalIssueUseCaseInput,
  'id' | 'userId'
> {
  @IsNotEmpty({ message: 'A conclusão é obrigatória para resolver a entrada' })
  @IsString({ message: 'A conclusão deve ser um texto' })
  conclusion: string;
}
