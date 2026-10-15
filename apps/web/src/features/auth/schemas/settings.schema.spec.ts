import { describe, expect, it } from 'vitest'

import { updatePasswordSchema, updateUserSchema } from './settings.schema'

describe('account settings schemas', () => {
  it('accepts the minimum profile name and strips non-editable email', () => {
    expect(updateUserSchema.parse({ name: 'Ada', email: 'new@example.com' })).toEqual({ name: 'Ada' })
  })

  it.each(['', 'Al'])('rejects the profile name %j', (name) => {
    const result = updateUserSchema.safeParse({ name })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(['name'])
  })

  it('accepts a six-character password and requires no change to its contents', () => {
    const input = { currentPassword: 'old-password', password: 'new123', confirmPassword: 'new123' }
    expect(updatePasswordSchema.parse(input)).toEqual(input)
  })

  it.each([
    ['currentPassword', ''], ['password', 'short'], ['confirmPassword', ''],
    ['confirmPassword', 'another-password'],
  ])('associates invalid %s input %j with its field', (field, value) => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: 'old-password', password: 'new-password',
      confirmPassword: 'new-password', [field]: value,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual([field])
    }
  })
})
