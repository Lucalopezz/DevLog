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

import { LoginForm } from './login-form'

function renderLoginForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<h1>Home destination</h1>} />
    </Routes>,
    { route: '/login' },
  )
}

async function completeLoginForm(
  user: ReturnType<typeof renderLoginForm>['user'],
) {
  await user.type(screen.getByLabelText('E-mail'), 'alex@example.com')
  await user.type(screen.getByLabelText('Password'), 'valid-password')
}

describe('LoginForm', () => {
  it('exposes labeled fields and blocks an empty submission', async () => {
    let postCount = 0
    server.use(
      http.post(apiUrl('/auth/login'), () => {
        postCount += 1
        return HttpResponse.json(createUser())
      }),
    )
    const { user } = renderLoginForm()

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your password.')).toBeVisible()
    expect(screen.getByText('Enter a valid email address.')).toBeVisible()
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(postCount).toBe(0)
  })

  it('blocks an invalid e-mail without sending a request', async () => {
    let postCount = 0
    server.use(
      http.post(apiUrl('/auth/login'), () => {
        postCount += 1
        return HttpResponse.json(createUser())
      }),
    )
    const { user } = renderLoginForm()

    await user.type(screen.getByLabelText('E-mail'), 'invalid')
    await user.type(screen.getByLabelText('Password'), 'x')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeVisible()
    expect(postCount).toBe(0)
  })

  it('disables repeated submission while the request is pending', async () => {
    const responseGate = deferred<void>()
    let postCount = 0
    server.use(
      http.post(apiUrl('/auth/login'), async () => {
        postCount += 1
        await responseGate.promise
        return HttpResponse.json(createUser())
      }),
    )
    const { user } = renderLoginForm()

    try {
      await completeLoginForm(user)
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      const pendingButton = await screen.findByRole('button', {
        name: 'Signing in...',
      })
      expect(pendingButton).toBeDisabled()
      await user.click(pendingButton)
      expect(postCount).toBe(1)
    } finally {
      responseGate.resolve(undefined)
    }

    expect(
      await screen.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible()
  })

  it('stores the signed-in user, shows feedback, and opens home', async () => {
    const account = createUser({
      name: 'Alex Reader',
      email: 'alex@example.com',
    })
    let submittedBody: unknown
    server.use(
      http.post(apiUrl('/auth/login'), async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json(account)
      }),
    )
    const { user, client } = renderLoginForm()

    await completeLoginForm(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible()
    expect(submittedBody).toEqual({
      email: account.email,
      password: 'valid-password',
    })
    expect(client.getQueryData(currentUserQueryKey)).toEqual(account)
    expect(
      (await screen.findAllByText('Signed in successfully!')).at(-1),
    ).toBeVisible()
  })

  it.each([
    [
      '401',
      HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 }),
      'Invalid credentials.',
    ],
    [
      '422',
      HttpResponse.json({ message: ['Invalid login input.'] }, { status: 422 }),
      'Invalid login input.',
    ],
    [
      '500',
      HttpResponse.json({}, { status: 500 }),
      'Could not sign in. Check your credentials and try again.',
    ],
    [
      'network',
      HttpResponse.error(),
      'Could not sign in. Check your credentials and try again.',
    ],
  ] as const)('keeps the form usable after a %s failure', async (_case, response, message) => {
    server.use(http.post(apiUrl('/auth/login'), () => response))
    const { user } = renderLoginForm()

    await completeLoginForm(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeEnabled()
    expect(screen.getByLabelText('E-mail')).toHaveValue('alex@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('valid-password')
    expect((await screen.findAllByText(message)).at(-1)).toBeVisible()
  })

  it('permits a successful retry after an authentication failure', async () => {
    let attempt = 0
    server.use(
      http.post(apiUrl('/auth/login'), () => {
        attempt += 1
        return attempt === 1
          ? HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 })
          : HttpResponse.json(createUser({ email: 'alex@example.com' }))
      }),
    )
    const { user } = renderLoginForm()

    await completeLoginForm(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect((await screen.findAllByText('Invalid credentials.')).at(-1)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible()
    expect(attempt).toBe(2)
  })
})
