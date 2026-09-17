import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { getProjectQueryKey } from '@/features/projects/api/get-project'
import { projectDetailKeys } from '@/features/projects/api/list-project-details'
import type { ProjectCommand, ProjectResource } from '@/features/projects/types/project-detail'
import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import ProjectDetailPage from './project-detail-page'

const project = createProjectFixture({
  technologies: [{
    id: 'technology-1',
    name: 'React',
    version: '19',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
  }],
})
const command: ProjectCommand = {
  id: 'command-1',
  projectId: project.id,
  title: 'Run checks',
  command: 'pnpm test',
  description: 'Run the test suite.',
  executionOrder: 2,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
}
const resource: ProjectResource = {
  id: 'resource-1',
  projectId: project.id,
  label: 'Project docs',
  url: 'https://example.com/docs',
  type: 'DOCUMENTATION',
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
}
const entry = createTechnicalEntry({
  title: 'Fix query synchronization',
  type: 'ISSUE',
  status: 'RESOLVED',
  conclusion: 'Invalidate the linked collection.',
  tags: [{ id: 'tag-1', name: 'cache' }],
})

function collection<T>(data: T[], total = data.length, page = 1) {
  return {
    data,
    meta: {
      currentPage: page,
      perPage: 6,
      lastPage: total > 6 ? Math.ceil(total / 6) : 1,
      total,
    },
  }
}

function installDetailHandlers() {
  server.use(
    http.get(apiUrl(`/project/${project.id}`), () => HttpResponse.json(project)),
    http.get(apiUrl(`/project/${project.id}/technical-entries`), () =>
      HttpResponse.json(collection([entry], 14)),
    ),
    http.get(apiUrl(`/project/${project.id}/commands`), () =>
      HttpResponse.json(collection([command], 8)),
    ),
    http.get(apiUrl(`/project/${project.id}/resources`), () =>
      HttpResponse.json(collection([resource], 7)),
    ),
  )
}

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>,
    { route: `/projects/${project.id}` },
  )
}

async function openTab(user: ReturnType<typeof renderDetail>['user'], name: string) {
  await user.click(await screen.findByRole('tab', { name }))
  return screen.getByRole('tabpanel')
}

describe('ProjectDetailPage', () => {
  it('shows the parent skeleton, then Overview totals from metadata and technologies', async () => {
    installDetailHandlers()
    const gate = deferred<void>()
    server.use(
      http.get(apiUrl(`/project/${project.id}`), async () => {
        await gate.promise
        return HttpResponse.json(project)
      }),
    )
    try {
      renderDetail()
      expect(screen.getByRole('status', { name: 'Loading project' })).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }

    expect(await screen.findByRole('heading', { name: project.name })).toBeVisible()
    await waitFor(() => expect(screen.getByText('14')).toBeVisible())
    expect(screen.getByText('8')).toBeVisible()
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText('React')).toBeVisible()
    expect(screen.getByText('19')).toBeVisible()
  })

  it('renders a 404 with a way back to the list', async () => {
    installDetailHandlers()
    server.use(
      http.get(apiUrl(`/project/${project.id}`), () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    )
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Project not found' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to projects' })).toHaveAttribute('href', '/projects')
  })

  it('shows the existing empty message when the project has no technologies', async () => {
    installDetailHandlers()
    server.use(
      http.get(apiUrl(`/project/${project.id}`), () =>
        HttpResponse.json({ ...project, technologies: [] }),
      ),
    )
    renderDetail()
    expect(await screen.findByText('No technologies have been recorded yet.')).toBeVisible()
  })

  it('renders command, resource, and entry fields in their own tabs', async () => {
    installDetailHandlers()
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: project.name })

    let panel = await openTab(user, 'Commands')
    expect(within(panel).getByText('Run checks')).toBeVisible()
    expect(within(panel).getByText('pnpm test')).toBeVisible()
    expect(within(panel).getByText('Run the test suite.')).toBeVisible()
    expect(within(panel).getByText('2. Command')).toBeVisible()

    panel = await openTab(user, 'Resources')
    expect(within(panel).getByRole('link', { name: /Project docs/ })).toHaveAttribute('href', resource.url)
    expect(within(panel).getByRole('link', { name: /Project docs/ })).toHaveAttribute('target', '_blank')
    expect(within(panel).getByRole('link', { name: /Project docs/ })).toHaveAttribute('rel', 'noreferrer')

    panel = await openTab(user, 'Technical entries')
    expect(within(panel).getByRole('link', { name: entry.title })).toHaveAttribute(
      'href', `/technical-entries/${entry.id}`,
    )
    expect(within(panel).getByText('Resolved')).toBeVisible()
    expect(within(panel).getByText('#cache')).toBeVisible()
    expect(within(panel).getByText(entry.conclusion!)).toBeVisible()
    expect(within(panel).getByText(/Updated/)).toBeVisible()
  })

  it.each([
    ['Commands', 'commands', 'No commands have been recorded for this project.'],
    ['Resources', 'resources', 'No resources have been recorded for this project.'],
    ['Technical entries', 'technical-entries', 'No technical entries have been recorded for this project.'],
  ])('%s owns pending, empty, error, and retry states without replacing the parent', async (tab, endpoint, emptyMessage) => {
    installDetailHandlers()
    const gate = deferred<void>()
    let requestCount = 0
    server.use(
      http.get(apiUrl(`/project/${project.id}/${endpoint}`), async () => {
        requestCount += 1
        if (requestCount === 1) {
          await gate.promise
          return HttpResponse.json(collection([]))
        }
        if (requestCount === 2) return HttpResponse.json({ message: 'Offline' }, { status: 500 })
        return HttpResponse.json(collection([]))
      }),
    )
    const { user, client } = renderDetail()
    try {
      const panel = await openTab(user, tab)
      expect(within(panel).getByText('Loading content...')).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByText(emptyMessage)).toBeVisible()
    await act(async () => {
      void client.invalidateQueries({ queryKey: getProjectQueryKey(project.id) })
    })
    expect(await screen.findByText('Could not load this section.')).toBeVisible()
    expect(screen.getByRole('heading', { name: project.name })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(emptyMessage)).toBeVisible()
    expect(requestCount).toBe(3)
  })

  it('paginates each collection independently', async () => {
    installDetailHandlers()
    const seen = { commands: [] as number[], resources: [] as number[], entries: [] as number[] }
    server.use(
      http.get(apiUrl(`/project/${project.id}/commands`), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        seen.commands.push(page)
        return HttpResponse.json(collection([command], 8, page))
      }),
      http.get(apiUrl(`/project/${project.id}/resources`), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        seen.resources.push(page)
        return HttpResponse.json(collection([resource], 7, page))
      }),
      http.get(apiUrl(`/project/${project.id}/technical-entries`), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        seen.entries.push(page)
        return HttpResponse.json(collection([entry], 14, page))
      }),
    )
    const { user } = renderDetail()
    await openTab(user, 'Commands')
    await user.click(await screen.findByRole('button', { name: 'Next' }))
    await waitFor(() => expect(seen.commands).toContain(2))
    await openTab(user, 'Resources')
    expect(screen.getByText(/Page 1 of 2/)).toBeVisible()
    await openTab(user, 'Technical entries')
    expect(screen.getByText(/Page 1 of 3/)).toBeVisible()
    expect(seen.resources).toEqual([1])
    expect(seen.entries).toEqual([1])
  })

  it('disables section pagination while its visible page refetches', async () => {
    installDetailHandlers()
    const gate = deferred<void>()
    let requests = 0
    server.use(
      http.get(apiUrl(`/project/${project.id}/commands`), async () => {
        requests += 1
        if (requests > 1) await gate.promise
        return HttpResponse.json(collection([command], 8))
      }),
    )
    const { user, client } = renderDetail()
    await openTab(user, 'Commands')
    await screen.findByText(command.title)
    try {
      await act(async () => {
        void client.invalidateQueries({ queryKey: projectDetailKeys.commands(project.id, { page: 1, perPage: 6 }) })
      })
      expect(await screen.findByRole('button', { name: 'Next' })).toBeDisabled()
      expect(screen.getByText(command.title)).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled())
  })

  it('keeps useful detail visible during a parent refetch', async () => {
    installDetailHandlers()
    const gate = deferred<void>()
    let count = 0
    server.use(
      http.get(apiUrl(`/project/${project.id}`), async () => {
        count += 1
        if (count > 1) await gate.promise
        return HttpResponse.json(project)
      }),
    )
    const { client } = renderDetail()
    await screen.findByRole('heading', { name: project.name })
    try {
      await act(async () => {
        void client.invalidateQueries({ queryKey: getProjectQueryKey(project.id), exact: true })
      })
      expect(await screen.findByText('Updating project...')).toBeVisible()
      expect(screen.getByText('React')).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.queryByText('Updating project...')).toBeNull())
  })

  it('refetches complete detail after PATCH and reopens the edit dialog with fresh values', async () => {
    installDetailHandlers()
    let current = project
    let patchBody: unknown
    server.use(
      http.get(apiUrl(`/project/${project.id}`), () => HttpResponse.json(current)),
      http.patch(apiUrl(`/project/${project.id}`), async ({ request }) => {
        patchBody = await request.json()
        current = {
          ...current,
          name: 'Renamed project',
          updatedAt: '2026-09-16T12:00:00Z',
        }
        // The PATCH contract is partial: it need not carry technologies.
        return HttpResponse.json({ ...current, technologies: undefined })
      }),
    )
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: project.name })
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Edit project' }))
    let dialog = screen.getByRole('dialog', { name: 'Edit project' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Renamed project')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(patchBody).toMatchObject({ name: 'Renamed project' }))
    expect(await screen.findByRole('heading', { name: 'Renamed project' })).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    expect(screen.getByText('React')).toBeVisible()
    expect(screen.getByText('19')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Edit project' }))
    dialog = screen.getByRole('dialog', { name: 'Edit project' })
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Renamed project')
  })

  it('creates an entry from the project and refreshes the Entries tab and Overview total', async () => {
    installDetailHandlers()
    let linkedEntries: typeof entry[] = []
    let postBody: unknown
    server.use(
      http.get(apiUrl(`/project/${project.id}/technical-entries`), () =>
        HttpResponse.json(collection(linkedEntries)),
      ),
      http.post(apiUrl('/technical-entry'), async ({ request }) => {
        postBody = await request.json()
        linkedEntries = [entry]
        return HttpResponse.json(entry, { status: 201 })
      }),
    )
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: project.name })
    await waitFor(() => expect(screen.getByText('0')).toBeVisible())
    await openTab(user, 'Technical entries')
    await user.click(screen.getByRole('button', { name: 'New entry' }))
    const dialog = screen.getByRole('dialog', { name: 'New technical entry' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Fix query synchronization')
    await user.type(within(dialog).getByRole('textbox', { name: 'Context' }), 'Investigate a stale project list.')
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
    expect(await screen.findByRole('link', { name: entry.title })).toBeVisible()
    expect(postBody).toMatchObject({ projectId: project.id })
    await openTab(user, 'Overview')
    expect(screen.getByText('1')).toBeVisible()
  })

  it('shows an unsupported resource URL as text without making it a link', async () => {
    installDetailHandlers()
    server.use(
      http.get(apiUrl(`/project/${project.id}/resources`), () =>
        HttpResponse.json(collection([{ ...resource, url: 'javascript:alert(1)' }])),
      ),
    )
    const { user } = renderDetail()
    await openTab(user, 'Resources')
    expect(await screen.findByText('Project docs')).toBeVisible()
    expect(screen.queryByRole('link', { name: /Project docs/ })).toBeNull()
    expect(screen.getByText('javascript:alert(1)')).toBeVisible()
  })
})
