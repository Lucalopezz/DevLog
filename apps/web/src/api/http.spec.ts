import { describe, expect, it } from 'vitest'

import { testApiUrl } from '@/test/mocks/urls'

import { api } from './http'

describe('shared API client', () => {
  it('uses the configured API base URL and sends browser credentials', () => {
    expect(api.defaults.baseURL).toBe(testApiUrl)
    expect(api.defaults.withCredentials).toBe(true)
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })
})
