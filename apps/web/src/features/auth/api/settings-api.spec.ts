import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

import { updateUser } from './update-user'
import { updateUserPassword } from './update-user-password'

describe('settings API contracts', () => {
  it('patches the current user name and unwraps the response', async () => {
    const updatedUser = createUser({ name: 'Ada Byron' })
    const input = { name: updatedUser.name }
    let submittedBody: unknown

    server.use(
      http.patch(apiUrl('/users/me'), async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json(updatedUser)
      }),
    )

    await expect(updateUser(input)).resolves.toEqual(updatedUser)
    expect(submittedBody).toEqual(input)
  })

  it('patches the current password and unwraps the response', async () => {
    const user = createUser()
    const input = {
      currentPassword: 'old-secret',
      password: 'new-secret',
      confirmPassword: 'new-secret',
    }
    let submittedBody: unknown

    server.use(
      http.patch(apiUrl('/users/me/password'), async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json(user)
      }),
    )

    await expect(updateUserPassword(input)).resolves.toEqual(user)
    expect(submittedBody).toEqual(input)
  })
})
