import { describe, expect, it } from 'vitest'

import { registerSchema } from './register.schema'

const validInput = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'secret',
  confirmPassword: 'secret',
}

describe('registerSchema', () => {
  it.each([
    ['name', { name: 'Al' }],
    ['password', { password: '12345', confirmPassword: '12345' }],
    ['confirmation', { confirmPassword: '' }],
  ])('rejects a value below the %s boundary', (_field, overrides) => {
    expect(registerSchema.safeParse({ ...validInput, ...overrides }).success).toBe(
      false,
    )
  })

  it('attaches a password mismatch to confirmPassword', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      confirmPassword: 'different',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['confirmPassword'],
            message: 'Passwords do not match.',
          }),
        ]),
      )
    }
  })

  it('accepts the minimum valid name and password lengths', () => {
    expect(registerSchema.parse(validInput)).toEqual(validInput)
  })
})
