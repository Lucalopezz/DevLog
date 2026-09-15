import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

import { LoginForm } from './login-form'

it('explains what is missing when the login form is empty', async () => {
  const { user } = renderWithProviders(<LoginForm />)

  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByText('Enter your password.')).toBeVisible()
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(screen.getByText('Enter a valid email address.')).toBeVisible()
})
