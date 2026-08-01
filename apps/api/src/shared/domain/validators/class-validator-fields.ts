import type {
  FieldsError,
  ValidatorsFieldsInterface,
} from './validators-fields.interface';
import { validateSync } from 'class-validator';

export abstract class ClassValidatorFields<
  PropsValidated extends object,
> implements ValidatorsFieldsInterface<PropsValidated> {
  errors: FieldsError | null = null;

  validatedData: PropsValidated | null = null;

  validate(data: PropsValidated): boolean {
    this.errors = null;
    this.validatedData = null;

    const validationErrors = validateSync(data);

    if (validationErrors.length > 0) {
      this.errors = validationErrors.reduce<FieldsError>((acc, error) => {
        acc[error.property] = Object.values(error.constraints ?? {});
        return acc;
      }, {});

      return false;
    }

    this.validatedData = data;
    return true;
  }
}
