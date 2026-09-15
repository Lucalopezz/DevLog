import { describe, expect, it } from 'vitest'

import {
  contextSchema,
  createTechnicalEntrySchema,
  updateTechnicalEntryTitleSchema,
} from './technical-entry.schema'

const projectId = '11111111-1111-4111-8111-111111111111'
const validInput = {
  title: 'API error',
  projectId,
  context: 'The request fails during submission.',
  type: 'ISSUE' as const,
  conclusion: '',
}

describe('createTechnicalEntrySchema', () => {
  it.each([2, 201])('rejects a trimmed title with %i characters', (length) => {
    expect(
      createTechnicalEntrySchema.safeParse({
        ...validInput,
        title: ` ${'a'.repeat(length)} `,
      }).success,
    ).toBe(false)
  })

  it.each([3, 200])('accepts and trims a title with %i characters', (length) => {
    const title = 'a'.repeat(length)

    expect(
      createTechnicalEntrySchema.parse({
        ...validInput,
        title: ` ${title} `,
      }).title,
    ).toBe(title)
  })

  it.each(['ISSUE', 'LEARNING'])('accepts type %s', (type) => {
    expect(
      createTechnicalEntrySchema.safeParse({ ...validInput, type }).success,
    ).toBe(true)
  })

  it('accepts an empty conclusion', () => {
    expect(createTechnicalEntrySchema.safeParse(validInput).success).toBe(true)
  })

  it.each([undefined, null, '', projectId])(
    'accepts the supported project selection %j',
    (value) => {
      const input = { ...validInput, projectId: value }
      expect(createTechnicalEntrySchema.safeParse(input).success).toBe(true)
    },
  )

  it('rejects a non-UUID project ID', () => {
    expect(
      createTechnicalEntrySchema.safeParse({
        ...validInput,
        projectId: 'not-a-uuid',
      }).success,
    ).toBe(false)
  })
})

describe('contextSchema', () => {
  it('rejects two non-whitespace characters after trimming', () => {
    expect(contextSchema.safeParse('  ab  ').success).toBe(false)
  })

  it('accepts three characters and returns the trimmed context', () => {
    expect(contextSchema.parse('  abc  ')).toBe('abc')
  })
})

describe('updateTechnicalEntryTitleSchema', () => {
  it('accepts a title without requiring the long-form fields', () => {
    expect(updateTechnicalEntryTitleSchema.parse({ title: '  Fixed  ' })).toEqual(
      { title: 'Fixed' },
    )
  })
})
