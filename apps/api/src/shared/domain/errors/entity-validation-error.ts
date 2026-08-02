import { FieldsError } from '../validators/validators-fields.interface';

export class EntityValidationError extends Error {
  constructor(public error: FieldsError) {
    super('Entity validation error');
    this.name = 'EntityValidationError';
  }
}
