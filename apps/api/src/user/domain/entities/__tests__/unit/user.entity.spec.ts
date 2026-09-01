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

  it('mantém propriedades válidas e as expõe como JSON', () => {
    const props = makeProps();
    const user = new UserEntity(props, 'user-id');

    expect(user.toJSON()).toEqual({ id: 'user-id', ...props });
  });

  it('agrupa erros de validação antes de construir um usuário inválido', () => {
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
    expect(validationError.error.name).toContain('O nome é obrigatório');
    expect(validationError.error.email).toContain('O e-mail deve ser válido');
    expect(validationError.error.password).toContain('A senha é obrigatória');
  });

  it('atualiza somente o campo solicitado e renova updatedAt', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    const user = new UserEntity(makeProps());

    user.updateName('Updated User');

    expect(user.name).toBe('Updated User');
    expect(user.email).toBe('lucas@example.com');
    expect(user.updatedAt).toEqual(new Date('2026-08-02T12:00:00.000Z'));
  });

  it('valida a atualização de senha antes de alterar a entidade', () => {
    const user = new UserEntity(makeProps());

    expect(() => user.updatePassword('')).toThrow(EntityValidationError);
    expect(user.password).toBe('hashed-password');
  });
});
