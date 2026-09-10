# Entity validation workflow

This document explains domain validation in the DevLog API, using `UserEntity` as an example.

## Overview

The workflow can be represented as follows:

```text
UserEntity
   ↓
UserValidatorFactory
   ↓
UserValidator
   ↓
UserRules + class-validator decorators
   ↓
ClassValidatorFields.validate()
   ↓
FieldsError
   ↓
EntityValidationError
```

Each part has a different responsibility:

1. `UserRules` declares user-specific rules.
2. `ClassValidatorFields` executes rules and organizes errors.
3. `UserValidator` connects user rules to the generic validator.
4. `UserEntity` prevents invalid entities from being created or updated.
5. `EntityValidationError` carries errors to the layer that called the entity.

## 1. The `FieldsError` format

[`validators-fields.interface.ts`](../../apps/api/src/shared/domain/validators/validators-fields.interface.ts) defines the error format:

```ts
export type FieldsError = {
  [field: string]: string[];
};
```

The object uses field names as keys and lists of messages as values:

```ts
{
  name: ['Name is required'],
  email: ['Email must be valid'],
  password: ['Password is required']
}
```

A field uses `string[]`, rather than a single string, because multiple rules may fail together. For example, a value may be empty and also violate another requirement.

The same interface defines the contract validators must follow:

```ts
export interface ValidatorsFieldsInterface<PropsValidated extends object> {
  errors: FieldsError | null;
  validatedData: PropsValidated | null;
  validate(data: PropsValidated): boolean;
}
```

A validator reports three things:

- Whether data is valid, through the boolean return value of `validate`;
- Which fields failed, through `errors`;
- Which data passed validation, through `validatedData`.

## 2. The shared generic validator

[`class-validator-fields.ts`](../../apps/api/src/shared/domain/validators/class-validator-fields.ts) contains the reusable abstract class:

```ts
export abstract class ClassValidatorFields<
  PropsValidated extends object,
> implements ValidatorsFieldsInterface<PropsValidated> {
  // ...
}
```

It knows nothing about users or other entities. Its responsibility is to run `class-validator`:

```ts
const validationErrors = validateSync(data);
```

Before validating, it clears previous state:

```ts
this.errors = null;
this.validatedData = null;
```

The same validator instance could be reused. Without resetting it, errors from a previous validation could leak into the next one.

When errors occur, `class-validator` returns objects with internal details. The shared class converts them to the simple `FieldsError` format:

```ts
this.errors = validationErrors.reduce<FieldsError>((acc, error) => {
  acc[error.property] = Object.values(error.constraints ?? {});
  return acc;
}, {});
```

In other words:

```text
Internal class-validator errors
        ↓
Property name + constraint messages
        ↓
FieldsError
```

If there are no errors, validated data is stored and the method returns `true`:

```ts
this.validatedData = data;
return true;
```

If errors exist, the method stores `errors` and returns `false`.

## 3. User-specific rules

[`user.validator.ts`](../../apps/api/src/user/domain/validators/user.validator.ts) declares `UserRules`.

It contains the `class-validator` decorators:

```ts
@MaxLength(120, {
  message: 'Name must be at most 120 characters long',
})
@IsString({ message: 'Name must be a string' })
@IsNotEmpty({ message: 'Name is required' })
name: string;
```

These decorators describe the rules for `name`. The same applies to `email`, `password`, `createdAt`, and `updatedAt`.

`UserRules` does not inherit from `ClassValidatorFields`. It is the object decorated with rules; the shared class executes those decorators.

Its constructor copies the supplied properties:

```ts
constructor({ name, email, password, createdAt, updatedAt }: UserProps) {
  Object.assign(this, { name, email, password, createdAt, updatedAt });
}
```

The instance is needed because `class-validator` reads decorator metadata from the `UserRules` class.

## 4. The role of `UserValidator`

`UserValidator` specializes the shared validator:

```ts
export class UserValidator extends ClassValidatorFields<UserRules> {
  validate(data: UserRules): boolean {
    return super.validate(new UserRules(data));
  }
}
```

This class adapts user data to the format expected by the rules:

```text
UserProps
   ↓
new UserRules(data)
   ↓
ClassValidatorFields.validate()
```

The factory creates the validator:

```ts
export class UserValidatorFactory {
  static create(): UserValidator {
    return new UserValidator();
  }
}
```

The factory is simple today, but it decouples the entity from concrete validator construction. If dependencies or another implementation become necessary, creation can change without changing entity usage.

## 5. The entity protects domain state

[`user.entity.ts`](../../apps/api/src/user/domain/entities/user.entity.ts) validates data in its constructor:

```ts
constructor(
  public readonly props: UserProps,
  id?: string,
) {
  UserEntity.validate(props);
  super(props, id);
}
```

A `UserEntity` can therefore only be created with valid data.

The static method centralizes validator integration:

```ts
static validate(props: UserProps): void {
  const userValidator = UserValidatorFactory.create();
  const isValid = userValidator.validate(props);

  if (!isValid) {
    throw new EntityValidationError(userValidator.errors ?? {});
  }
}
```

The failure flow is:

```text
UserEntity.validate(props)
        ↓
validator.validate(props) === false
        ↓
userValidator.errors
        ↓
throw new EntityValidationError(errors)
```

The entity does not return a partially valid object. It stops the operation by throwing an exception.

Validation also runs during changes that can modify state:

```ts
updateName(name?: string): void {
  const updatedProps = {
    ...this.props,
    ...(name !== undefined && { name }),
  };

  UserEntity.validate(updatedProps);

  // Apply the change only after validation
}
```

First, construct and validate the future properties. Only then apply the value. This prevents a failed update from leaving the entity invalid.

## 6. The domain error

[`entity-validation-error.ts`](../../apps/api/src/shared/domain/errors/entity-validation-error.ts) defines the error thrown by the entity:

```ts
export class EntityValidationError extends Error {
  constructor(public error: FieldsError) {
    super('Entity validation error');
    this.name = 'EntityValidationError';
  }
}
```

The error contains two different kinds of information:

```ts
error.message
```

contains the general message:

```text
Entity validation error
```

Whereas:

```ts
error.error
```

contains field-level details:

```ts
{
  email: ['Email must be valid'],
  password: ['Password is required']
}
```

The general message does not replace field messages. It identifies the overall error type, while `error` preserves the details.

Code catching the exception can access both:

```ts
try {
  new UserEntity(props);
} catch (error) {
  if (error instanceof EntityValidationError) {
    console.log(error.message);
    console.log(error.error);
  }
}
```

## 7. What happens in the HTTP API at this stage?

At the stage described here, the domain flow was implemented but the HTTP layer was incomplete.

The user controller still had empty methods:

```ts
@Post()
create(@Body() createUserDto: CreateUserDto) {}
```

`CreateUserDto` also had no properties or rules:

```ts
export class CreateUserDto {}
```

An HTTP request therefore did not yet travel through the entire flow below:

```text
HTTP request
   ↓
Controller
   ↓
Use case
   ↓
UserEntity
   ↓
EntityValidationError
   ↓
resposta HTTP formatada
```

HTTP exception handling still needed implementation. An exception filter or another handler should convert the domain error to a response such as:

```json
{
  "message": "Entity validation error",
  "errors": {
    "email": ["Email must be valid"],
    "password": ["Password is required"]
  }
}
```

Without this handling, `error.message` is only `Entity validation error`, and details remain available solely in `error.error` to code catching the exception.

## 8. Dates received over HTTP

User rules use `@IsDate()` for `createdAt` and `updatedAt`:

```ts
@IsDate({ message: 'Creation date must be valid' })
createdAt: Date;
```

A date created in code is usually a `Date` object:

```ts
new Date();
```

An HTTP request, however, usually contains a JSON string:

```json
{
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

Before creating the entity, convert that string to `Date` or use appropriate input transformation. This conversion belongs at the application boundary and must not be hidden inside the entity.

## 9. Layered validation

The project can validate in multiple layers, each with a different responsibility:

```text
DTO
   ↓ validates HTTP input format
Use case
   ↓ coordinates the operation
Entity
   ↓ protects domain rules
Repository
   ↓ persists data
```

Entity validation matters because different entry points can create an entity, not only controllers. A use case, test, or another adapter still gets the same domain protection.

A useful distinction is:

- DTO: validates input and the format expected by the API;
- Entity: validates whether the state is acceptable to the domain;
- Database: enforces persistence constraints, such as uniqueness and the existence of related records.

These validations may overlap partially, but they do not fully replace one another.

## Summary

The user validation flow works as follows:

1. `UserRules` declares rules with decorators.
2. `UserValidator` creates a `UserRules` instance.
3. `ClassValidatorFields` runs `class-validator`.
4. Errors are converted to `FieldsError`.
5. `UserEntity` stops creation or updates when errors occur.
6. `EntityValidationError` receives detailed errors.
7. `error.message` contains only the general message.
8. `error.error` contains fields and their messages.

The domain validation foundation exists. At the stage described here, exposing these errors to HTTP clients still required connecting controllers, DTOs, use cases, and API exception handling.
