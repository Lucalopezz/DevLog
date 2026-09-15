import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

import { getCurrentUser } from './get-current-user'
import { login } from './login'
import { logout } from './logout'
import { registerUser } from './register'

describe('authentication API contracts', () => {
  it('unwraps the current user from GET /users/me', async () => {
    const user = createUser()
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(user)),
    )

    await expect(getCurrentUser()).resolves.toEqual(user)
  })

  it('posts the login JSON and unwraps the user', async () => {
    const input = { email: 'ada@example.com', password: 'secret' }
    const user = createUser()
    let capturedBody: unknown
    let contentType: string | null = null

    server.use(
      http.post(apiUrl('/auth/login'), async ({ request }) => {
        capturedBody = await request.json()
        contentType = request.headers.get('content-type')
        return HttpResponse.json(user)
      }),
    )

    await expect(login(input)).resolves.toEqual(user)
    expect(capturedBody).toEqual(input)
    expect(contentType).toContain('application/json')
  })

  it('posts registration including confirmPassword and unwraps the user', async () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    }
    const user = createUser()
    let capturedBody: unknown

    server.use(
      http.post(apiUrl('/users'), async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(user, { status: 201 })
      }),
    )

    await expect(registerUser(input)).resolves.toEqual(user)
    expect(capturedBody).toEqual(input)
  })

  it('posts logout without requiring a response envelope', async () => {
    let requestCount = 0
    server.use(
      http.post(apiUrl('/auth/logout'), () => {
        requestCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(logout()).resolves.toBeUndefined()
    expect(requestCount).toBe(1)
  })

  it('propagates a 401 response to its consumer', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )

    await expect(getCurrentUser()).rejects.toMatchObject({
      response: { status: 401 },
    })
  })
})
