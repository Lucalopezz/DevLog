import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { currentUserQueryKey } from '@/features/auth/api/get-current-user'
import { deferred } from '@/test/deferred'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import SettingsPage from './settings-page'

describe('SettingsPage', () => {
  it('loads the profile, saves the updated name, and synchronizes the user cache', async () => {
    const userData = createUser()
    const updatedUser = createUser({ name: 'Ada Byron' })
    let submittedBody: unknown

    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(userData)),
      http.patch(apiUrl('/users/me'), async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json(updatedUser)
      }),
    )

    const { user, client } = renderWithProviders(<SettingsPage />)

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue(
      userData.name,
    )
    expect(screen.getByText(userData.email)).toBeVisible()

    await user.clear(screen.getByRole('textbox', { name: 'Name' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), updatedUser.name)
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(submittedBody).toEqual({ name: updatedUser.name }))
    expect(client.getQueryData(currentUserQueryKey)).toEqual(updatedUser)
    expect(await screen.findByText('Profile updated successfully!')).toBeVisible()
  })

  it('validates the profile name before sending a request', async () => {
    let requestCount = 0
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
      http.patch(apiUrl('/users/me'), () => {
        requestCount += 1
        return HttpResponse.json(createUser())
      }),
    )

    const { user } = renderWithProviders(<SettingsPage />)
    const nameInput = await screen.findByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Al')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Name must be at least 3 characters long.')).toBeVisible()
    expect(requestCount).toBe(0)
  })

  it('changes the password, shows pending state, and clears credential fields', async () => {
    const responseGate = deferred<void>()
    const userData = createUser()
    const password = {
      currentPassword: 'old-secret',
      password: 'new-secret',
      confirmPassword: 'new-secret',
    }
    let submittedBody: unknown

    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(userData)),
      http.patch(apiUrl('/users/me/password'), async ({ request }) => {
        submittedBody = await request.json()
        await responseGate.promise
        return HttpResponse.json(userData)
      }),
    )

    const { user } = renderWithProviders(<SettingsPage />)
    const currentPassword = await screen.findByLabelText('Current password')
    const newPassword = screen.getByLabelText('New password')
    const confirmPassword = screen.getByLabelText('Confirm new password')
    await user.type(currentPassword, password.currentPassword)
    await user.type(newPassword, password.password)
    await user.type(confirmPassword, password.confirmPassword)
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    try {
      expect(await screen.findByRole('button', { name: 'Updating...' })).toBeDisabled()
      expect(submittedBody).toEqual(password)
    } finally {
      responseGate.resolve(undefined)
    }

    await waitFor(() => {
      expect(currentPassword).toHaveValue('')
      expect(newPassword).toHaveValue('')
      expect(confirmPassword).toHaveValue('')
    })
    expect(await screen.findByText('Password updated successfully!')).toBeVisible()
  })

  it('rejects mismatched passwords without calling the API', async () => {
    let requestCount = 0
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
      http.patch(apiUrl('/users/me/password'), () => {
        requestCount += 1
        return HttpResponse.json(createUser())
      }),
    )

    const { user } = renderWithProviders(<SettingsPage />)
    await screen.findByRole('textbox', { name: 'Name' })
    await user.type(screen.getByLabelText('Current password'), 'old-secret')
    await user.type(screen.getByLabelText('New password'), 'new-secret')
    await user.type(screen.getByLabelText('Confirm new password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByText('Passwords do not match.')).toBeVisible()
    expect(requestCount).toBe(0)
  })
})
