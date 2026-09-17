import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createMatchMediaController } from '@/test/match-media'

import { useIsMobile } from './use-mobile'

const mobileQuery = '(max-width: 767px)'

describe('useIsMobile', () => {
  it.each([
    ['desktop', false],
    ['mobile', true],
  ] as const)('reads the initial %s media value', (_label, matches) => {
    const media = createMatchMediaController()
    media.setMatches(mobileQuery, matches)
    vi.stubGlobal('matchMedia', media.matchMedia)

    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(matches)
    expect(media.matchMedia(mobileQuery)).toBe(media.matchMedia(mobileQuery))
    expect(media.listenerCount(mobileQuery)).toBe(1)
    unmount()
    expect(media.listenerCount(mobileQuery)).toBe(0)
  })

  it('updates on change events and unsubscribes after unmount', () => {
    const media = createMatchMediaController()
    vi.stubGlobal('matchMedia', media.matchMedia)
    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    act(() => media.setMatches(mobileQuery, true))
    expect(result.current).toBe(true)
    act(() => media.setMatches(mobileQuery, false))
    expect(result.current).toBe(false)
    unmount()
    expect(media.listenerCount(mobileQuery)).toBe(0)
  })
})
