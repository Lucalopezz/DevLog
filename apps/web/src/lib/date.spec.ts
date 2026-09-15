import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatDate, formatRelativeDate } from './date'

describe('date presentation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    new Date('2026-01-05T18:30:00.000Z'),
    '2026-01-05T18:30:00.000Z',
  ])('formats the calendar date from %j in en-US', (value) => {
    expect(formatDate(value)).toBe('January 5, 2026')
  })

  it('formats a past date relative to the frozen clock', () => {
    expect(formatRelativeDate('2026-09-12T12:00:00.000Z')).toBe('2 days ago')
  })

  it('formats a future date relative to the frozen clock', () => {
    expect(formatRelativeDate(new Date('2026-09-16T12:00:00.000Z'))).toBe(
      'in 2 days',
    )
  })
})
