export type FieldsError = {
  [field: string]: string[];
};

export interface ValidatorsFieldsInterface<PropsValidated extends object> {
  errors: FieldsError | null;
  // the data that was validated and passed the validation,
  // if the data is invalid, this property will be null
  validatedData: PropsValidated | null;
  // function that receives an object and validates it,
  // returning true if the data is valid and false if the data is invalid
  validate(data: PropsValidated): boolean;
}
