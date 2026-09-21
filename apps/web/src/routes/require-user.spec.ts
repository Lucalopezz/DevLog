import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { createTestQueryClient } from '@/test/query-client'

import { createAuthLoaders } from './require-user'

async function rejectedValue(promise: Promise<unknown>) {
  try {
    await promise
    throw new Error('Expected the loader to reject.')
  } catch (error) {
    return error
  }
}

describe('authenticated route loader', () => {
  it('returns the authenticated user through the supplied cache', async () => {
    const user = createUser()
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(user)),
    )
    const client = createTestQueryClient()
    const { requireUser } = createAuthLoaders(client)

    await expect(requireUser()).resolves.toEqual(user)
  })

  it('redirects only a 401 response to login', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { requireUser } = createAuthLoaders(createTestQueryClient())

    const response = await rejectedValue(requireUser())
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(302)
    expect((response as Response).headers.get('Location')).toBe('/login')
  })

  it.each([403, 500])('propagates an HTTP %i response', async (status) => {
    server.use(
      http.get(apiUrl('/users/me'), () =>
        HttpResponse.json({ message: 'Request failed.' }, { status }),
      ),
    )
    const { requireUser } = createAuthLoaders(createTestQueryClient())

    await expect(requireUser()).rejects.toMatchObject({
      response: { status },
    })
  })

  it('propagates a network error', async () => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.error()))
    const { requireUser } = createAuthLoaders(createTestQueryClient())

    await expect(requireUser()).rejects.toBeDefined()
  })
})

describe('guest route loader', () => {
  it('allows a guest after a 401 response', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { redirectAuthenticatedUser } = createAuthLoaders(
      createTestQueryClient(),
    )

    await expect(redirectAuthenticatedUser()).resolves.toBeUndefined()
  })

  it('redirects an authenticated user to the dashboard', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
    )
    const { redirectAuthenticatedUser } = createAuthLoaders(
      createTestQueryClient(),
    )

    const response = await rejectedValue(redirectAuthenticatedUser())
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(302)
    expect((response as Response).headers.get('Location')).toBe('/dashboard')
  })

  it.each([403, 500])('propagates an HTTP %i response', async (status) => {
    server.use(
      http.get(apiUrl('/users/me'), () =>
        HttpResponse.json({ message: 'Request failed.' }, { status }),
      ),
    )
    const { redirectAuthenticatedUser } = createAuthLoaders(
      createTestQueryClient(),
    )

    await expect(redirectAuthenticatedUser()).rejects.toMatchObject({
      response: { status },
    })
  })

  it('propagates a network error', async () => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.error()))
    const { redirectAuthenticatedUser } = createAuthLoaders(
      createTestQueryClient(),
    )

    await expect(redirectAuthenticatedUser()).rejects.toBeDefined()
  })
})
