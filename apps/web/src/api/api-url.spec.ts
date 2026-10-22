import { describe, expect, it } from 'vitest'

import { resolveApiUrl } from './api-url'

describe('API URL selection', () => {
  it('uses the same-origin proxy in deployed builds', () => {
    expect(resolveApiUrl(undefined, true)).toBe('/api')
  })

  it('keeps local development on the standalone Nest server', () => {
    expect(resolveApiUrl(undefined, false)).toBe('http://localhost:3000/api')
  })

  it('respects an explicit URL and removes trailing slashes', () => {
    expect(resolveApiUrl('http://localhost:3001/api///', true)).toBe(
      'http://localhost:3001/api',
    )
  })
})
