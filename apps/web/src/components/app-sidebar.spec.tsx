import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { deferred } from '@/test/deferred'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { AppSidebar } from './app-sidebar'

function renderSidebar(route = '/') {
  return renderWithProviders(
    <SidebarProvider><AppSidebar /></SidebarProvider>,
    { route },
  )
}

describe('AppSidebar', () => {
  it('shows session progress, then guest access links', async () => {
    const responseGate = deferred<void>()
    server.use(http.get(apiUrl('/users/me'), async () => {
      await responseGate.promise
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }))

    try {
      renderSidebar('/login')
      expect(screen.getByText('Checking session...')).toBeVisible()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create account' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument()
  })

  it('shows account identity, active archive route and disabled future items', async () => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())))
    renderSidebar('/technical-entries/archived')

    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Archived Entries' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Technical Journal' })).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Quick Capture' })).toBeDisabled()
    expect(screen.getAllByText('Soon').length).toBeGreaterThan(0)
  })
})
