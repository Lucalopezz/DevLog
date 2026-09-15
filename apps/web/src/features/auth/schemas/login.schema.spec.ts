import { describe, expect, it } from 'vitest'

import { loginSchema } from './login.schema'

describe('loginSchema', () => {
  it.each(['invalid', 'person@'])('rejects the invalid e-mail %j', (email) => {
    expect(loginSchema.safeParse({ email, password: 'x' }).success).toBe(false)
  })

  it('accepts a valid e-mail', () => {
    expect(
      loginSchema.safeParse({ email: 'person@example.com', password: 'x' })
        .success,
    ).toBe(true)
  })

  it('rejects an empty password', () => {
    expect(
      loginSchema.safeParse({ email: 'person@example.com', password: '' })
        .success,
    ).toBe(false)
  })

  it('accepts any nonempty password without inventing a registration rule', () => {
    expect(
      loginSchema.safeParse({ email: 'person@example.com', password: 'x' })
        .success,
    ).toBe(true)
  })
})
