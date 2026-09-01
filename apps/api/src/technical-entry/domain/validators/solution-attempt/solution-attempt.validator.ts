import { IsDate, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { SolutionAttemptProps } from '../../entities/solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from '../../entities/solution-attempt/solution-attempt-result.enum';

export class SolutionAttemptRules {
  @IsString({ message: 'O ID da entrada técnica deve ser um texto' })
  @IsNotEmpty({ message: 'O ID da entrada técnica é obrigatório' })
  @IsUUID('4', {
    message: 'O ID da entrada técnica deve ser um UUID válido',
  })
  technicalEntryId: string;

  @IsString({ message: 'A descrição da tentativa deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição da tentativa é obrigatória' })
  description: string;

  @IsEnum(SolutionAttemptResult, {
    message: 'O resultado da tentativa deve ser válido',
  })
  result: SolutionAttemptResult;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
  updatedAt: Date;

  constructor({
    technicalEntryId,
    description,
    result,
    createdAt,
    updatedAt,
  }: SolutionAttemptProps) {
    Object.assign(this, {
      technicalEntryId,
      description,
      result,
      createdAt,
      updatedAt,
    });
  }
}

export class SolutionAttemptValidator extends ClassValidatorFields<SolutionAttemptRules> {
  validate(data: SolutionAttemptRules): boolean {
    return super.validate(new SolutionAttemptRules(data));
  }
}

export class SolutionAttemptValidatorFactory {
  static create(): SolutionAttemptValidator {
    return new SolutionAttemptValidator();
  }
}
