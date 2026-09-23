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
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
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
      expect(
        screen.queryByRole('link', { name: 'Sign in' }),
      ).not.toBeInTheDocument()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create account' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument()
  })

  it('shows account identity, active archive route and available actions', async () => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())))
    renderSidebar('/technical-entries/archived')

    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Archived Entries' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: 'All Entries' }),
    ).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Quick Capture' })).toBeEnabled()
    expect(screen.getAllByText('Soon').length).toBeGreaterThan(0)
  })

  it('opens the help dialog with LinkedIn and portfolio contact links', async () => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())))
    const { user } = renderSidebar()

    await screen.findByRole('link', { name: 'Ada Lovelace' })
    await user.click(screen.getByRole('button', { name: 'Help & feedback' }))

    expect(screen.getByRole('dialog', { name: 'Help & feedback' })).toBeVisible()

    const linkedinLink = screen.getByRole('link', { name: /Connect on LinkedIn/ })
    expect(linkedinLink).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/lucas-dalossa-a24381356/',
    )
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')

    const portfolioLink = screen.getByRole('link', { name: /Visit my portfolio/ })
    expect(portfolioLink).toHaveAttribute('href', 'https://lucasdolopes.vercel.app/')
    expect(portfolioLink).toHaveAttribute('target', '_blank')
    expect(portfolioLink).toHaveAttribute('rel', 'noopener noreferrer')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Help & feedback' })).not.toBeInTheDocument()
  })

  it.each([
    ['/technical-entries', 'All Entries'],
    ['/technical-entries?title=react', 'All Entries'],
    ['/technical-entries?tag=typescript', 'All Entries'],
    ['/technical-entries?type=ISSUE&status=OPEN', 'Open Issues'],
    ['/technical-entries?type=LEARNING', 'Learnings'],
    ['/technical-entries?type=ISSUE&status=RESOLVED', 'Resolved Issues'],
    ['/technical-entries/archived', 'Archived Entries'],
  ])('activates only %s journal item', async (route, activeLabel) => {
    server.use(http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())))
    renderSidebar(route)

    await screen.findByRole('link', { name: 'Ada Lovelace' })

    const journalLabels = [
      'All Entries',
      'Open Issues',
      'Learnings',
      'Resolved Issues',
      'Archived Entries',
    ]

    for (const label of journalLabels) {
      const link = screen.getByRole('link', { name: label })
      if (label === activeLabel) {
        expect(link).toHaveAttribute('aria-current', 'page')
      } else {
        expect(link).not.toHaveAttribute('aria-current', 'page')
      }
    }
  })
})
