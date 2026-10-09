import { AxiosError, CanceledError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { isTemporaryApiError, retryRead } from './is-temporary-api-error'

describe('read retry policy', () => {
  it.each([502, 503, 504])('permits only one repeat of HTTP %i', (status) => {
    const error = new AxiosError(
      'Request failed',
      undefined,
      undefined,
      undefined,
      { status } as AxiosResponse,
    )
    expect(retryRead(0, error)).toBe(true)
    expect(retryRead(1, error)).toBe(false)
  })
  it.each([401, 403, 404, 429, 500])('does not repeat HTTP %i', (status) => {
    expect(
      retryRead(
        0,
        new AxiosError('Request failed', undefined, undefined, undefined, {
          status,
        } as AxiosResponse),
      ),
    ).toBe(false)
  })
  it.each(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'])(
    'recognizes %s as temporary',
    (code) => {
      expect(isTemporaryApiError(new AxiosError('Request failed', code))).toBe(
        true,
      )
    },
  )
  it('does not repeat a caller cancellation or an unexpected programming error', () => {
    expect(retryRead(0, new CanceledError())).toBe(false)
    expect(retryRead(0, new Error('Unexpected error'))).toBe(false)
  })
})
