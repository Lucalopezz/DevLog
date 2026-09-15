import { screen, waitForElementToBeRemoved } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import AccountPage from './account-page'

describe('AccountPage', () => {
  it('shows loading text until the account request resolves', async () => {
    const responseGate = deferred<void>()
    server.use(
      http.get(apiUrl('/users/me'), async () => {
        await responseGate.promise
        return HttpResponse.json(createUser())
      }),
    )

    try {
      renderWithProviders(<AccountPage />)
      expect(screen.getByText('Loading account...')).toBeVisible()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(
      await screen.findByRole('heading', { name: 'User account' }),
    ).toBeVisible()
  })

  it('shows the current user name and e-mail', async () => {
    const user = createUser({ name: 'Alex Reader', email: 'alex@example.com' })
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(user)),
    )

    renderWithProviders(<AccountPage />)

    expect(await screen.findByText(user.name)).toBeVisible()
    expect(screen.getByText(user.email)).toBeVisible()
  })

  it('renders no account content when reused without a user', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(null)),
    )

    renderWithProviders(<AccountPage />)

    await waitForElementToBeRemoved(() => screen.queryByText('Loading account...'))
    expect(
      screen.queryByRole('heading', { name: 'User account' }),
    ).not.toBeInTheDocument()
  })
})
