import { describe, expect, it } from 'vitest'

import {
  createProjectSchema,
  updateProjectSchema,
} from './project.schema'

const updateInput = {
  name: 'DevLog',
  description: 'A study project',
  status: 'ACTIVE' as const,
  localPath: '/workspace/devlog',
}

describe('createProjectSchema', () => {
  it.each([2, 151])('rejects a name with %i characters', (length) => {
    expect(
      createProjectSchema.safeParse({ name: 'a'.repeat(length) }).success,
    ).toBe(false)
  })

  it.each([3, 150])('accepts a name with %i characters', (length) => {
    expect(
      createProjectSchema.safeParse({ name: 'a'.repeat(length) }).success,
    ).toBe(true)
  })

  it('accepts an omitted optional description', () => {
    expect(createProjectSchema.parse({ name: 'API' })).toEqual({ name: 'API' })
  })
})

describe('updateProjectSchema', () => {
  it('trims the name returned to the submit handler', () => {
    expect(updateProjectSchema.parse({ ...updateInput, name: '  DevLog  ' }).name)
      .toBe('DevLog')
  })

  it.each(['ACTIVE', 'INACTIVE', 'FINISHED'])('accepts status %s', (status) => {
    expect(updateProjectSchema.safeParse({ ...updateInput, status }).success).toBe(
      true,
    )
  })

  it('rejects an unsupported status', () => {
    expect(
      updateProjectSchema.safeParse({ ...updateInput, status: 'ARCHIVED' })
        .success,
    ).toBe(false)
  })

  it('accepts an empty description so an existing value can be cleared', () => {
    expect(
      updateProjectSchema.safeParse({ ...updateInput, description: '' }).success,
    ).toBe(true)
  })
})
