import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { UserEntity, UserProps } from '../../user.entity';

function makeProps(overrides: Partial<UserProps> = {}): UserProps {
  return {
    name: 'Lucas Lopes',
    email: 'lucas@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UserEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('preserves valid properties and exposes them as JSON', () => {
    const props = makeProps();
    const user = new UserEntity(props, 'user-id');

    expect(user.toJSON()).toEqual({ id: 'user-id', ...props });
  });

  it('groups validation errors before constructing an invalid user', () => {
    let caughtError: unknown;
    try {
      new UserEntity(
        makeProps({ name: '', email: 'invalid-email', password: '' }),
      );
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(EntityValidationError);
    const validationError = caughtError as EntityValidationError;
    expect(validationError.error.name).toContain('Name is required');
    expect(validationError.error.email).toContain('Email must be valid');
    expect(validationError.error.password).toContain('Password is required');
  });

  it('updates only the requested field and refreshes updatedAt', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    const user = new UserEntity(makeProps());

    user.updateName('Updated User');

    expect(user.name).toBe('Updated User');
    expect(user.email).toBe('lucas@example.com');
    expect(user.updatedAt).toEqual(new Date('2026-08-02T12:00:00.000Z'));
  });

  it('validates the password update before changing the entity', () => {
    const user = new UserEntity(makeProps());

    expect(() => user.updatePassword('')).toThrow(EntityValidationError);
    expect(user.password).toBe('hashed-password');
  });
});
