import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createProjectFixture } from '@/test/factories/project'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderApp } from '@/test/render-app'

const projectId = '22222222-2222-4222-8222-222222222222'
const entryId = '33333333-3333-4333-8333-333333333333'
const emptyCollection = {
  data: [],
  meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 0 },
}

function useGuestSession() {
  server.use(
    http.get(apiUrl('/users/me'), () =>
      HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    ),
  )
}

function useSignedInApplication() {
  const project = createProjectFixture({ id: projectId, name: 'Route project' })
  const entry = createTechnicalEntry({ id: entryId, title: 'Route entry' })

  server.use(
    http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
    http.get(apiUrl('/project'), () => HttpResponse.json(emptyCollection)),
    http.get(apiUrl('/project/environments'), () => HttpResponse.json(emptyCollection)),
    http.get(apiUrl(`/project/${projectId}`), () => HttpResponse.json(project)),
    http.get(apiUrl(`/project/${projectId}/technical-entries`), () =>
      HttpResponse.json(emptyCollection),
    ),
    http.get(apiUrl(`/project/${projectId}/commands`), () =>
      HttpResponse.json(emptyCollection),
    ),
    http.get(apiUrl(`/project/${projectId}/resources`), () =>
      HttpResponse.json(emptyCollection),
    ),
    http.get(apiUrl('/technical-entry'), () =>
      HttpResponse.json(emptyCollection),
    ),
    http.get(apiUrl(`/technical-entry/${entryId}`), () =>
      HttpResponse.json(entry),
    ),
    http.get(apiUrl('/tag'), () => HttpResponse.json(emptyCollection)),
  )
}

describe('application routing', () => {

  it('renders the public landing page without checking a session', async () => {
    let sessionRequestCount = 0
    server.use(
      http.get(apiUrl('/users/me'), () => {
        sessionRequestCount += 1
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }),
    )

    renderApp('/')

    expect(
      await screen.findByRole('heading', {
        name: 'Keep the reasoning behind your code.',
      }),
    ).toBeVisible()
    expect(
      screen.getAllByRole('link', { name: 'Create account' }).length,
    ).toBeGreaterThan(0)
    expect(sessionRequestCount).toBe(0)
  })

  it.each([
    ['/', 'Keep the reasoning behind your code.'],
    ['/login', 'Sign in'],
    ['/register', 'Create account'],
  ])('renders %s without probing API health', async (route, heading) => {
    let healthRequestCount = 0
    useGuestSession()
    server.use(
      http.get(apiUrl('/health'), () => {
        healthRequestCount += 1
        return HttpResponse.json({ status: 'ok' })
      }),
    )

    renderApp(route)

    expect(await screen.findByRole('heading', { name: heading })).toBeVisible()
    expect(healthRequestCount).toBe(0)
    if (route !== '/') {
      expect(screen.getByRole('button', { name: heading })).toBeEnabled()
    }
  })

  it('retries a failed private loader directly without a health gate', async () => {
    useSignedInApplication()
    let available = false
    let healthRequests = 0
    server.use(
      http.get(apiUrl('/health'), () => {
        healthRequests += 1
        return new HttpResponse(null, { status: 503 })
      }),
      http.get(apiUrl('/users/me'), () => available
        ? HttpResponse.json(createUser())
        : new HttpResponse(null, { status: 503 })),
    )
    const { user, router } = renderApp('/account')
    expect(await screen.findByRole('heading', { name: 'Could not load this page' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/account')
    available = true
    await user.click(screen.getByRole('button', { name: 'Try loading again' }))
    expect(await screen.findByRole('heading', { name: 'User account' })).toBeVisible()
    expect(healthRequests).toBe(0)
  })

  it.each([
    '/dashboard',
    '/activity-timeline',
    '/knowledge-overview',
    '/account',
    '/projects',
    `/projects/${projectId}`,
    '/technical-entries',
    `/technical-entries/${entryId}`,
    '/technical-entries/archived',
    '/tags',
    '/environments',
  ])('redirects a guest from protected route %s', async (route) => {
    useGuestSession()

    renderApp(route)

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()
  })

  it.each([
    ['/dashboard', 'Welcome back, Ada.'],
    ['/activity-timeline', 'Activity Timeline'],
    ['/knowledge-overview', 'Knowledge Overview'],
    ['/account', 'User account'],
    ['/projects', 'Projects'],
    ['/environments', 'Environments'],
    [`/projects/${projectId}`, 'Route project'],
    ['/technical-entries', 'Technical journal'],
    [`/technical-entries/${entryId}`, 'Route entry'],
    ['/technical-entries/archived', 'Archived technical entries'],
    ['/tags', 'Tags'],
  ])('renders heading %s for a signed-in visit to %s', async (route, heading) => {
    useSignedInApplication()

    renderApp(route)

    expect(await screen.findByRole('heading', { name: heading })).toBeVisible()
  })

  it.each(['/login', '/register'])(
    'redirects a signed-in user away from %s',
    async (route) => {
      useSignedInApplication()

      renderApp(route)

      expect(
        await screen.findByRole('heading', {
          name: 'Welcome back, Ada.',
        }),
      ).toBeVisible()
    },
  )

  it('ranks the static archive route before the entry detail route', async () => {
    useSignedInApplication()

    renderApp('/technical-entries/archived')

    expect(
      await screen.findByRole('heading', {
        name: 'Archived technical entries',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Technical entry not found' }),
    ).not.toBeInTheDocument()
  })
})
