import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './get-api-error-message'

function createAxiosError(data?: unknown) {
  const response = data === undefined
    ? undefined
    : ({ data, status: 400 } as AxiosResponse)

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response)
}

describe('getApiErrorMessage', () => {
  it('uses the API message when it is a non-empty string', () => {
    expect(
      getApiErrorMessage(
        createAxiosError({ message: 'E-mail or password is incorrect.' }),
        'Please try again.',
      ),
    ).toBe('E-mail or password is incorrect.')
  })

  it('joins the validation messages returned by Nest', () => {
    expect(
      getApiErrorMessage(
        createAxiosError({ message: ['Name is required.', 'Name is too short.'] }),
        'Please try again.',
      ),
    ).toBe('Name is required. Name is too short.')
  })

  it.each([
    createAxiosError({ message: '   ' }),
    createAxiosError({}),
    createAxiosError(),
    new Error('offline'),
  ])('uses the fallback when no usable API message exists', (error) => {
    expect(getApiErrorMessage(error, 'Please try again.')).toBe(
      'Please try again.',
    )
  })
})
