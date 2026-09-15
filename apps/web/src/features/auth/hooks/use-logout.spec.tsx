import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { projectsKeys } from '@/features/projects/api/list-projects'
import type { ProjectCollection } from '@/features/projects/types/project'
import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { createUser } from '@/test/factories/user'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderApp } from '@/test/render-app'
import { renderWithProviders } from '@/test/render-with-providers'

function renderSidebar() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        }
      />
      <Route path="/login" element={<h1>Login destination</h1>} />
    </Routes>,
  )
}

describe('logout flow', () => {
  it('disables sign-out while pending, clears the session, and navigates', async () => {
    const responseGate = deferred<void>()
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
      http.post(apiUrl('/auth/logout'), async () => {
        await responseGate.promise
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user, client } = renderSidebar()

    try {
      await user.click(await screen.findByRole('button', { name: 'Sign out' }))
      expect(
        await screen.findByRole('button', { name: 'Signing out...' }),
      ).toBeDisabled()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(
      await screen.findByRole('heading', { name: 'Login destination' }),
    ).toBeVisible()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('keeps the session available when logout fails', async () => {
    server.use(
      http.get(apiUrl('/users/me'), () => HttpResponse.json(createUser())),
      http.post(apiUrl('/auth/logout'), () =>
        HttpResponse.json({ message: 'Could not sign out.' }, { status: 500 }),
      ),
    )
    const { user } = renderSidebar()

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeEnabled()
    expect(screen.queryByText('Signed out successfully!')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Login destination' }),
    ).not.toBeInTheDocument()
  })

  it('does not let a late response from account A repopulate account B cache', async () => {
    const accountAProjectGate = deferred<void>()
    const accountA = createUser({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Account A',
      email: 'a@example.com',
    })
    const accountB = createUser({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Account B',
      email: 'b@example.com',
    })
    const projectA = createProjectFixture({ name: 'Private project A' })
    const projectB = createProjectFixture({
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Private project B',
    })
    let sessionUser: ReturnType<typeof createUser> | undefined = accountA
    let projectRequestCount = 0

    server.use(
      http.get(apiUrl('/users/me'), () =>
        sessionUser
          ? HttpResponse.json(sessionUser)
          : HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
      http.get(apiUrl('/project'), async () => {
        projectRequestCount += 1
        if (projectRequestCount === 1) {
          return HttpResponse.json({
            data: [projectA],
            meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
          })
        }

        if (projectRequestCount === 2) {
          await accountAProjectGate.promise
          return HttpResponse.json({
            data: [projectA],
            meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
          })
        }

        return HttpResponse.json({
          data: [projectB],
          meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
        })
      }),
      http.post(apiUrl('/auth/logout'), () => {
        sessionUser = undefined
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(apiUrl('/auth/login'), () => {
        sessionUser = accountB
        return HttpResponse.json(accountB)
      }),
    )
    const { user, client } = renderApp('/projects')

    try {
      expect(await screen.findByText(projectA.name)).toBeVisible()
      await act(async () => {
        void client.invalidateQueries({ queryKey: projectsKeys.lists() })
      })
      expect(await screen.findByText('Updating...')).toBeVisible()

      await user.click(await screen.findByRole('button', { name: 'Sign out' }))
      expect(
        await screen.findByRole('heading', { name: 'Sign in' }),
      ).toBeVisible()

      await user.type(screen.getByLabelText('E-mail'), accountB.email)
      await user.type(screen.getByLabelText('Password'), 'valid-password')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      await screen.findByRole('heading', { name: 'Frontend foundation ready' })

      await user.click(screen.getByRole('link', { name: 'Projects' }))
      expect(await screen.findByText(projectB.name)).toBeVisible()
    } finally {
      accountAProjectGate.resolve(undefined)
    }

    expect(screen.queryByText(projectA.name)).not.toBeInTheDocument()
    expect(projectRequestCount).toBeGreaterThanOrEqual(3)
    const cachedProjectLists = client.getQueriesData<ProjectCollection>({
      queryKey: projectsKeys.lists(),
    })
    expect(
      cachedProjectLists.flatMap(([, collection]) => collection?.data ?? []),
    ).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: projectA.name })]))
  })
})
