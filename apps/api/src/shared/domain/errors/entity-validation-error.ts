import { FieldsError } from '../validators/validators-fields.interface';
import { ValidationError } from './validation-error';

export class EntityValidationError extends ValidationError {
  constructor(public error: FieldsError) {
    super('Entity validation error');
    this.name = 'EntityValidationError';
  }
}
