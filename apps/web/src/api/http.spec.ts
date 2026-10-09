import { describe, expect, it } from 'vitest'
import { AxiosError, type AxiosAdapter } from 'axios'

import { testApiUrl } from '@/test/mocks/urls'

import { api } from './http'

describe('shared API client', () => {
  it('uses the configured API base URL and sends browser credentials', () => {
    expect(api.defaults.baseURL).toBe(testApiUrl)
    expect(api.defaults.withCredentials).toBe(true)
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it.each(['get', 'head'] as const)(
    'gives %s requests a bounded wait and respects explicit deadlines',
    async (method) => {
      const deadlines: number[] = []
      const adapter: AxiosAdapter = async (config) => {
        deadlines.push(config.timeout ?? 0)
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }
      await api.request({ url: '/test/read', method, adapter })
      await api.request({ url: '/test/read', method, adapter, timeout: 2_000 })
      expect(deadlines).toEqual([15_000, 2_000])
    },
  )

  it.each(['post', 'patch', 'delete'] as const)(
    'does not resend a %s operation after losing its response',
    async (method) => {
      let sends = 0
      const adapter: AxiosAdapter = async (config) => {
        sends += 1
        throw new AxiosError('Response lost', 'ERR_NETWORK', config)
      }
      await expect(
        api.request({ url: '/test/write', method, adapter }),
      ).rejects.toMatchObject({ code: 'ERR_NETWORK' })
      expect(sends).toBe(1)
    },
  )
})
