import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from '../../create-user.dto';
import { UpdateUserDto } from '../../update-user.dto';
import { UpdateUserPasswordDto } from '../../update-user-password.dto';

const options = { whitelist: true, forbidNonWhitelisted: true };
const registration = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'secret123',
  confirmPassword: 'secret123',
};

describe('CreateUserDto', () => {
  it('accepts registration at the minimum name and password lengths', async () => {
    expect(
      await validate(
        plainToInstance(CreateUserDto, {
          ...registration,
          name: 'Ada',
          password: 'secret',
          confirmPassword: 'secret',
        }),
        options,
      ),
    ).toEqual([]);
  });

  it.each([
    ['name', 'Al'],
    ['name', 123],
    ['email', 'invalid'],
    ['password', 'short'],
    ['password', 123456],
    ['confirmPassword', ''],
    ['confirmPassword', null],
  ])('rejects invalid %s input %p', async (property, value) => {
    const errors = await validate(
      plainToInstance(CreateUserDto, {
        ...registration,
        [property]: value,
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toContain(property);
  });

  it('rejects client-controlled IDs and password hashes', async () => {
    const errors = await validate(
      plainToInstance(CreateUserDto, {
        ...registration,
        id: 'client-id',
        passwordHash: 'client-hash',
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['id', 'passwordHash']),
    );
  });
});

describe('account update DTOs', () => {
  it('allows changing a name while rejecting email and ownership fields', async () => {
    expect(
      await validate(
        plainToInstance(UpdateUserDto, { name: 'Ada Byron' }),
        options,
      ),
    ).toEqual([]);
    const errors = await validate(
      plainToInstance(UpdateUserDto, {
        name: 'Al',
        email: 'another@example.com',
        userId: 'another-user',
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'email', 'userId']),
    );
  });

  it('requires all credentials before a password change', async () => {
    const errors = await validate(
      plainToInstance(UpdateUserPasswordDto, {}),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'currentPassword',
        'password',
        'confirmPassword',
      ]),
    );
  });

  it('accepts a valid password change and rejects a short new password', async () => {
    const input = {
      currentPassword: 'old-secret',
      password: 'secret',
      confirmPassword: 'secret',
    };
    expect(
      await validate(plainToInstance(UpdateUserPasswordDto, input), options),
    ).toEqual([]);
    const errors = await validate(
      plainToInstance(UpdateUserPasswordDto, {
        ...input,
        password: 'short',
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toContain('password');
  });
});
