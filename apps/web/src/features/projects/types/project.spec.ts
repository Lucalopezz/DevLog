import { describe, expect, it } from 'vitest'

import { isProjectStatus } from './project'

describe('isProjectStatus', () => {
  it.each(['ACTIVE', 'INACTIVE', 'FINISHED'])('accepts %s', (value) => {
    expect(isProjectStatus(value)).toBe(true)
  })

  it.each(['active', 'ARCHIVED', null, undefined])('rejects %j', (value) => {
    expect(isProjectStatus(value)).toBe(false)
  })
})
