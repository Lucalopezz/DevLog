import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { LoginForm } from '@/features/auth/components/login-form'
import { deferred } from '@/test/deferred'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'
import { http, HttpResponse } from 'msw'

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/dashboard" element={<p>Signed in</p>} />
    </Routes>,
    { route: '/login' },
  )
}

describe('FormInput through LoginForm', () => {
  it('connects the visible label, invalid state, and error message to the input', async () => {
    const { user } = renderLogin()
    const email = screen.getByRole('textbox', { name: 'E-mail' })
    expect(document.querySelector('label[for]')).toHaveAttribute('for', email.id)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    const error = await screen.findByText('Enter a valid email address.')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email.getAttribute('aria-describedby')).toContain(error.id)
  })

  it('propagates the disabled state while submission is pending', async () => {
    const gate = deferred<void>()
    server.use(http.post(apiUrl('/auth/login'), async () => {
      await gate.promise
      return HttpResponse.json(createUser())
    }))
    const { user } = renderLogin()
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'valid-password')
    try {
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(await screen.findByRole('button', { name: 'Signing in...' })).toBeDisabled()
      expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeDisabled()
      expect(screen.getByLabelText('Password')).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByText('Signed in')).toBeVisible()
  })
})
