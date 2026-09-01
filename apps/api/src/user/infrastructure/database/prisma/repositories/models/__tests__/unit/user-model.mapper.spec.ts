import { ValidationError } from '@/shared/domain/errors/validation-error';
import { User } from '@generated/prisma/client';
import { UserModelMapper } from '../../user-model.mapper';

const timestamp = new Date('2026-08-01T00:00:00.000Z');

function makeModel(overrides: Partial<User> = {}): User {
  return {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'Lucas Lopes',
    email: 'lucas@example.com',
    passwordHash: 'hashed-password',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('UserModelMapper', () => {
  it('converte o modelo persistido em entidade sem expor a nomenclatura do banco', () => {
    const entity = UserModelMapper.toEntity(makeModel());

    expect(entity).toMatchObject({
      id: '123e4567-e89b-42d3-a456-426614174000',
      name: 'Lucas Lopes',
      email: 'lucas@example.com',
      password: 'hashed-password',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  it('converte falhas de hidratação em erro da camada de mapeamento', () => {
    expect(() =>
      UserModelMapper.toEntity(makeModel({ email: 'invalid' })),
    ).toThrow(ValidationError);
  });
});
