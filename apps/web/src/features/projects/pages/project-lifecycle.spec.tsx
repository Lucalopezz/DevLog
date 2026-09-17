import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'
import { useProjects } from '../hooks/use-projects'

import ProjectDetailPage from './project-detail-page'

const project = createProjectFixture()
const empty = { data: [], meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 } }

function ActiveProjectsProbe() {
  const query = useProjects({ page: 1, archivedAt: 'null' })
  return <output aria-label="Active project total">{query.data?.meta.total ?? 'Loading'}</output>
}

function renderLifecycle(initial = project, withList = false) {
  let current = initial
  const requests = { entries: 0, commands: 0, resources: 0 }
  server.use(
    http.get(apiUrl(`/project/${project.id}`), () => HttpResponse.json(current)),
    http.get(apiUrl('/project'), () => {
      const active = current.archivedAt ? [] : [current]
      return HttpResponse.json({
        data: active,
        meta: { currentPage: 1, perPage: 10, lastPage: 1, total: active.length },
      })
    }),
    http.get(apiUrl(`/project/${project.id}/technical-entries`), () => {
      requests.entries += 1
      return HttpResponse.json(empty)
    }),
    http.get(apiUrl(`/project/${project.id}/commands`), () => {
      requests.commands += 1
      return HttpResponse.json(empty)
    }),
    http.get(apiUrl(`/project/${project.id}/resources`), () => {
      requests.resources += 1
      return HttpResponse.json(empty)
    }),
    http.patch(apiUrl(`/project/${project.id}/archive`), () => {
      current = { ...current, archivedAt: '2026-09-16T12:00:00Z' }
      return HttpResponse.json(current)
    }),
    http.patch(apiUrl(`/project/${project.id}/restore`), () => {
      current = { ...current, archivedAt: undefined }
      return HttpResponse.json(current)
    }),
  )
  const result = renderWithProviders(
    <>
      {withList ? <ActiveProjectsProbe /> : null}
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects" element={<p>Project list destination</p>} />
      </Routes>
    </>,
    { route: `/projects/${project.id}` },
  )
  return { ...result, requests, setCurrent: (next: typeof current) => { current = next } }
}

async function settings(user: ReturnType<typeof renderLifecycle>['user']) {
  await user.click(await screen.findByRole('tab', { name: 'Settings' }))
}

describe('project lifecycle', () => {
  it('cancels archive without PATCH, then archives and refreshes the detail collections', async () => {
    let patches = 0
    const { user, requests, setCurrent } = renderLifecycle(project, true)
    server.use(http.patch(apiUrl(`/project/${project.id}/archive`), () => {
      patches += 1
      const next = { ...project, archivedAt: '2026-09-16T12:00:00Z' }
      setCurrent(next)
      return HttpResponse.json(next)
    }))
    await settings(user)
    await waitFor(() => expect(screen.getByLabelText('Active project total')).toHaveTextContent('1'))
    await user.click(screen.getByRole('button', { name: 'Archive project' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(patches).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Archive project' }))
    dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Archive project' }))
    await waitFor(() => expect(patches).toBe(1))
    await waitFor(() => expect(requests.entries).toBeGreaterThan(1))
    expect(requests.commands).toBeGreaterThan(1)
    expect(requests.resources).toBeGreaterThan(1)
    expect(screen.getByRole('button', { name: 'Edit project' })).toBeDisabled()
    await waitFor(() => expect(screen.getByLabelText('Active project total')).toHaveTextContent('0'))
  })

  it('keeps archive confirmation available after failure and prevents duplicate pending requests', async () => {
    const gate = deferred<void>()
    let patches = 0
    const { user } = renderLifecycle()
    server.use(http.patch(apiUrl(`/project/${project.id}/archive`), async () => {
      patches += 1
      await gate.promise
      return HttpResponse.json({ message: 'Archive failed' }, { status: 500 })
    }))
    await settings(user)
    await user.click(screen.getByRole('button', { name: 'Archive project' }))
    const dialog = await screen.findByRole('alertdialog')
    try {
      await user.click(within(dialog).getByRole('button', { name: 'Archive project' }))
      await waitFor(() => expect(patches).toBe(1))
      expect(within(dialog).getByRole('button', { name: 'Archive project' })).toBeDisabled()
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByText('Archive failed')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Archive project' })).toBeEnabled()
  })

  it('restores an archived project, re-enabling editing; cancellation and failure do not', async () => {
    let attempts = 0
    const archived = createProjectFixture({ archivedAt: '2026-09-15T12:00:00Z' })
    const { user, setCurrent } = renderLifecycle(archived, true)
    server.use(http.patch(apiUrl(`/project/${project.id}/restore`), () => {
      attempts += 1
      if (attempts === 1) return HttpResponse.json({ message: 'Restore failed' }, { status: 500 })
      setCurrent(project)
      return HttpResponse.json(project)
    }))
    await settings(user)
    expect(screen.getByRole('button', { name: 'Edit project' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete project' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Restore project' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(attempts).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Restore project' }))
    dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Restore project' }))
    expect(await screen.findByText('Restore failed')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Restore project' })).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Restore project' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit project' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Delete project' })).toBeEnabled()
    await waitFor(() => expect(screen.getByLabelText('Active project total')).toHaveTextContent('1'))
  })

  it('requires an exact case-sensitive project name, submits once, and navigates after deletion', async () => {
    const gate = deferred<void>()
    let deletes = 0
    const { user } = renderLifecycle()
    server.use(http.delete(apiUrl(`/project/${project.id}`), async () => {
      deletes += 1
      await gate.promise
      return new HttpResponse(null, { status: 204 })
    }))
    await settings(user)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Delete permanently' })
    expect(confirm).toBeDisabled()
    const input = within(dialog).getByRole('textbox', { name: /Type DevLog to confirm/ })
    await user.type(input, 'devlog')
    expect(confirm).toBeDisabled()
    await user.clear(input)
    await user.type(input, ' DevLog ')
    expect(confirm).toBeEnabled()
    try {
      await user.click(confirm)
      await waitFor(() => expect(deletes).toBe(1))
      expect(confirm).toBeDisabled()
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByText('Project list destination')).toBeVisible()
    expect(deletes).toBe(1)
  })

  it('cancels deletion without sending DELETE', async () => {
    let deletes = 0
    const { user } = renderLifecycle()
    server.use(http.delete(apiUrl(`/project/${project.id}`), () => {
      deletes += 1
      return new HttpResponse(null, { status: 204 })
    }))
    await settings(user)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByRole('textbox', { name: /Type DevLog to confirm/ }), project.name)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(deletes).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    const reopened = await screen.findByRole('alertdialog')
    expect(within(reopened).getByRole('textbox', { name: /Type DevLog to confirm/ })).toHaveValue('')
  })

  it('retains delete confirmation for retry after failure', async () => {
    const { user } = renderLifecycle()
    server.use(http.delete(apiUrl(`/project/${project.id}`), () =>
      HttpResponse.json({ message: 'Delete failed' }, { status: 500 }),
    ))
    await settings(user)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByRole('textbox', { name: /Type DevLog to confirm/ }), project.name)
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
    expect(await screen.findByText('Delete failed')).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: /Type DevLog to confirm/ })).toHaveValue(project.name)
    expect(within(dialog).getByRole('button', { name: 'Delete permanently' })).toBeEnabled()
  })

  it('keeps archived projects read-only in Settings, Overview, and linked entry creation', async () => {
    const { user } = renderLifecycle(createProjectFixture({ archivedAt: '2026-09-15T12:00:00Z' }))
    await screen.findByRole('heading', { name: project.name })
    expect(screen.queryByRole('button', { name: 'Edit project description' })).toBeNull()
    await user.click(screen.getByRole('tab', { name: 'Technical entries' }))
    expect(screen.getByRole('button', { name: 'New entry' })).toBeDisabled()
    await settings(user)
    expect(screen.getByRole('button', { name: 'Edit project' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete project' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restore project' })).toBeEnabled()
  })
})
