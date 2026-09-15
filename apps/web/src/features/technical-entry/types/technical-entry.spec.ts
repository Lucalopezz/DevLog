import { describe, expect, it } from 'vitest'

import {
  isTechnicalEntryStatus,
  isTechnicalEntryType,
} from './technical-entry'

describe('technical entry guards', () => {
  it.each(['ISSUE', 'LEARNING'])('accepts the type %s', (value) => {
    expect(isTechnicalEntryType(value)).toBe(true)
  })

  it.each(['issue', 'NOTE', null, undefined])('rejects the type %j', (value) => {
    expect(isTechnicalEntryType(value)).toBe(false)
  })

  it.each(['OPEN', 'RESOLVED'])('accepts the status %s', (value) => {
    expect(isTechnicalEntryStatus(value)).toBe(true)
  })

  it.each(['open', 'CLOSED', null, undefined])(
    'rejects the status %j',
    (value) => {
      expect(isTechnicalEntryStatus(value)).toBe(false)
    },
  )
})
