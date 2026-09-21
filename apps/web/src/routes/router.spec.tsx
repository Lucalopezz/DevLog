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
    '/dashboard',
    '/account',
    '/projects',
    `/projects/${projectId}`,
    '/technical-entries',
    `/technical-entries/${entryId}`,
    '/technical-entries/archived',
    '/tags',
  ])('redirects a guest from protected route %s', async (route) => {
    useGuestSession()

    renderApp(route)

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()
  })

  it.each([
    ['/dashboard', 'Welcome back, Ada.'],
    ['/account', 'User account'],
    ['/projects', 'Projects'],
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
