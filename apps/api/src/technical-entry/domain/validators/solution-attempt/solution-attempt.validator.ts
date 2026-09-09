import { IsDate, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { SolutionAttemptProps } from '../../entities/solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from '../../entities/solution-attempt/solution-attempt-result.enum';

export class SolutionAttemptRules {
  @IsString({ message: 'Technical entry ID must be a string' })
  @IsNotEmpty({ message: 'Technical entry ID is required' })
  @IsUUID('4', {
    message: 'Technical entry ID must be a valid UUID',
  })
  technicalEntryId: string;

  @IsString({ message: 'Attempt description must be a string' })
  @IsNotEmpty({ message: 'Attempt description is required' })
  description: string;

  @IsEnum(SolutionAttemptResult, {
    message: 'Attempt result must be valid',
  })
  result: SolutionAttemptResult;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
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
