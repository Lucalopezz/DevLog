import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { currentUserQueryKey } from '@/features/auth/api/get-current-user'
import { deferred } from '@/test/deferred'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import RegisterPage from './register-page'

function renderRegisterPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<h1>Login destination</h1>} />
    </Routes>,
    { route: '/register' },
  )
}

async function completeForm(
  user: ReturnType<typeof renderRegisterPage>['user'],
) {
  await user.type(screen.getByLabelText('Name'), 'Alex Reader')
  await user.type(screen.getByLabelText('E-mail'), 'alex@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret')
  await user.type(screen.getByLabelText('Confirm password'), 'secret')
}

describe('RegisterPage', () => {
  it('shows field validation and attaches mismatch to confirmation', async () => {
    let postCount = 0
    server.use(
      http.post(apiUrl('/users'), () => {
        postCount += 1
        return HttpResponse.json(createUser())
      }),
    )
    const { user } = renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'Al')
    await user.type(screen.getByLabelText('E-mail'), 'invalid')
    await user.type(screen.getByLabelText('Password'), '12345')
    await user.type(screen.getByLabelText('Confirm password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText(/Name must be at least/)).toBeVisible()
    expect(screen.getByText('Enter a valid email address.')).toBeVisible()
    expect(screen.getByText(/Password must be at least/)).toBeVisible()
    expect(screen.getByText('Passwords do not match.')).toBeVisible()
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(postCount).toBe(0)
  })

  it('sends confirmation, shows pending feedback, and returns to login', async () => {
    const responseGate = deferred<void>()
    let submittedBody: unknown
    server.use(
      http.post(apiUrl('/users'), async ({ request }) => {
        submittedBody = await request.json()
        await responseGate.promise
        return HttpResponse.json(createUser(), { status: 201 })
      }),
    )
    const { user, client } = renderRegisterPage()

    try {
      await completeForm(user)
      await user.click(screen.getByRole('button', { name: 'Create account' }))
      expect(
        await screen.findByRole('button', { name: 'Creating...' }),
      ).toBeDisabled()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(
      await screen.findByRole('heading', { name: 'Login destination' }),
    ).toBeVisible()
    expect(submittedBody).toEqual({
      name: 'Alex Reader',
      email: 'alex@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    })
    expect(client.getQueryData(currentUserQueryKey)).toBeUndefined()
    expect(
      await screen.findByText('Account created successfully! Sign in to continue.'),
    ).toBeVisible()
  })

  it.each([
    [
      '409',
      HttpResponse.json({ message: 'E-mail already exists.' }, { status: 409 }),
      'E-mail already exists.',
    ],
    [
      '422',
      HttpResponse.json({ message: ['Invalid account input.'] }, { status: 422 }),
      'Invalid account input.',
    ],
    [
      '500',
      HttpResponse.json({}, { status: 500 }),
      'Could not create your account. Try again.',
    ],
    [
      'network',
      HttpResponse.error(),
      'Could not create your account. Try again.',
    ],
  ] as const)('retains the draft after a %s failure', async (_case, response, message) => {
    server.use(http.post(apiUrl('/users'), () => response))
    const { user } = renderRegisterPage()

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByRole('button', { name: 'Create account' }),
    ).toBeEnabled()
    expect(screen.getByLabelText('Name')).toHaveValue('Alex Reader')
    expect(screen.getByLabelText('E-mail')).toHaveValue('alex@example.com')
    expect((await screen.findAllByText(message)).at(-1)).toBeVisible()
  })
})
