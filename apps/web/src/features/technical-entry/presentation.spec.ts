import { describe, expect, it } from 'vitest'

import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from './presentation'

describe('technical entry presentation', () => {
  it.each([
    ['ISSUE', 'Issue'],
    ['LEARNING', 'Learning'],
  ] as const)('labels type %s as %s', (type, label) => {
    expect(presentTechnicalEntryType(type).label).toBe(label)
  })

  it.each([
    ['OPEN', 'Open'],
    ['RESOLVED', 'Resolved'],
  ] as const)('labels status %s as %s', (status, label) => {
    expect(presentTechnicalEntryStatus(status).label).toBe(label)
  })
})
