import { describe, expect, it } from 'vitest'

import { tagSchema } from './tag.schema'

describe('tagSchema', () => {
  it.each([2, 81])('rejects a name with %i characters', (length) => {
    expect(tagSchema.safeParse({ name: 'a'.repeat(length) }).success).toBe(false)
  })

  it.each([3, 80])('accepts a name with %i characters', (length) => {
    expect(tagSchema.safeParse({ name: 'a'.repeat(length) }).success).toBe(true)
  })

  it('rejects a whitespace-only name', () => {
    expect(tagSchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('trims the value returned to the submit handler', () => {
    expect(tagSchema.parse({ name: '  React  ' })).toEqual({ name: 'React' })
  })
})
