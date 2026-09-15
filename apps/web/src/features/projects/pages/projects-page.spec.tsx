import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'

import { projectsKeys } from '@/features/projects/api/list-projects'
import { deferred } from '@/test/deferred'
import {
  createProjectCollection,
  createProjectFixture,
} from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import ProjectsPage from './projects-page'

const baseMeta = {
  currentPage: 1,
  perPage: 10,
  lastPage: 1,
  total: 0,
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current search">{location.search}</output>
}

function HistoryControls() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/projects?name=Beta')} type="button">
        Open Beta
      </button>
      <button onClick={() => navigate(-1)} type="button">
        Back
      </button>
    </>
  )
}

function renderProjectsPage(route = '/projects', historyControls = false) {
  return renderWithProviders(
    <>
      <ProjectsPage />
      <LocationProbe />
      {historyControls ? <HistoryControls /> : null}
    </>,
    { route },
  )
}

function currentSearch() {
  return new URLSearchParams(
    screen.getByLabelText('Current search').textContent ?? '',
  )
}

describe('ProjectsPage list states', () => {
  it('shows a pending skeleton, cards, and correct detail links', async () => {
    const responseGate = deferred<void>()
    const project = createProjectFixture({ name: 'Visible project' })
    server.use(
      http.get(apiUrl('/project'), async () => {
        await responseGate.promise
        return HttpResponse.json(
          createProjectCollection({
            projects: [project],
            meta: { ...baseMeta, total: 1 },
          }),
        )
      }),
    )

    try {
      renderProjectsPage()
      expect(
        screen.getByRole('status', { name: 'Loading projects' }),
      ).toBeVisible()
    } finally {
      responseGate.resolve(undefined)
    }

    const title = await screen.findByText(project.name)
    expect(title.closest('a')).toHaveAttribute('href', `/projects/${project.id}`)
  })

  it('shows the empty state for an empty collection', async () => {
    server.use(
      http.get(apiUrl('/project'), () =>
        HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        ),
      ),
    )

    renderProjectsPage()

    expect(
      await screen.findByRole('heading', { name: 'No projects found' }),
    ).toBeVisible()
  })

  it('shows an error and retries the query', async () => {
    const project = createProjectFixture({ name: 'Recovered project' })
    let attempt = 0
    server.use(
      http.get(apiUrl('/project'), () => {
        attempt += 1
        return attempt === 1
          ? HttpResponse.json({ message: 'Unexpected error.' }, { status: 500 })
          : HttpResponse.json(
              createProjectCollection({
                projects: [project],
                meta: { ...baseMeta, total: 1 },
              }),
            )
      }),
    )
    const { user } = renderProjectsPage()

    expect(
      await screen.findByRole('heading', { name: 'Could not load projects' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText(project.name)).toBeVisible()
    expect(attempt).toBe(2)
  })

  it('announces a background update while preserving current cards', async () => {
    const responseGate = deferred<void>()
    const project = createProjectFixture({ name: 'Cached project' })
    let requestCount = 0
    server.use(
      http.get(apiUrl('/project'), async () => {
        requestCount += 1
        if (requestCount > 1) await responseGate.promise
        return HttpResponse.json(
          createProjectCollection({
            projects: [project],
            meta: { ...baseMeta, total: 1 },
          }),
        )
      }),
    )
    const { client } = renderProjectsPage()

    await screen.findByText(project.name)
    try {
      await act(async () => {
        void client.invalidateQueries({ queryKey: projectsKeys.lists() })
      })
      expect(await screen.findByText('Updating...')).toBeVisible()
      expect(screen.getByText(project.name)).toBeVisible()
    } finally {
      responseGate.resolve(undefined)
    }

    await waitFor(() => expect(screen.queryByText('Updating...')).toBeNull())
  })
})

describe('ProjectsPage URL contracts', () => {
  it('requests the default list contract', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        )
      }),
    )

    renderProjectsPage()
    await screen.findByRole('heading', { name: 'No projects found' })

    expect(Object.fromEntries(capturedUrl?.searchParams ?? [])).toEqual({
      perPage: '10',
      archivedAt: 'null',
      sort: 'createdAt',
      sortDir: 'desc',
      page: '1',
    })
  })

  it('honors valid deep-link filters and a large positive page', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(
          createProjectCollection({
            projects: [],
            meta: { ...baseMeta, currentPage: 999 },
          }),
        )
      }),
    )

    renderProjectsPage('/projects?page=999&name=%20API%20&status=FINISHED')
    await screen.findByRole('heading', { name: 'No projects found' })

    expect(capturedUrl?.searchParams.get('page')).toBe('999')
    expect(capturedUrl?.searchParams.get('name')).toBe('API')
    expect(capturedUrl?.searchParams.get('status')).toBe('FINISHED')
  })

  it.each([null, '0', '-1', '1.5', 'NaN', 'missing'])(
    'normalizes invalid page %s to page one',
    async (page) => {
      let requestedPage: string | null = null
      server.use(
        http.get(apiUrl('/project'), ({ request }) => {
          requestedPage = new URL(request.url).searchParams.get('page')
          return HttpResponse.json(
            createProjectCollection({ projects: [], meta: baseMeta }),
          )
        }),
      )
      const route = page === null ? '/projects' : `/projects?page=${page}`

      renderProjectsPage(route)
      await screen.findByRole('heading', { name: 'No projects found' })

      expect(requestedPage).toBe('1')
    },
  )

  it('omits an unsupported status', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        )
      }),
    )

    renderProjectsPage('/projects?status=ARCHIVED')
    await screen.findByRole('heading', { name: 'No projects found' })

    expect(capturedUrl?.searchParams.has('status')).toBe(false)
  })

  it('keeps typing as a draft then applies a trimmed search on page one', async () => {
    const requests: URL[] = []
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        )
      }),
    )
    const { user } = renderProjectsPage('/projects?page=3')
    await screen.findByRole('heading', { name: 'No projects found' })

    await user.type(screen.getByRole('textbox', { name: 'Name' }), '  API  ')
    expect(requests).toHaveLength(1)
    expect(currentSearch().has('name')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests.at(-1)?.searchParams.get('name')).toBe('API')
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1')
    expect(currentSearch().get('name')).toBe('API')
    expect(currentSearch().get('page')).toBe('1')
  })

  it('uses All to remove the status filter', async () => {
    const requests: URL[] = []
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        )
      }),
    )
    const { user } = renderProjectsPage('/projects?status=ACTIVE')
    await screen.findByRole('heading', { name: 'No projects found' })

    await user.selectOptions(screen.getByLabelText('Status'), '')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requests).toHaveLength(2))

    expect(requests.at(-1)?.searchParams.has('status')).toBe(false)
    expect(currentSearch().has('status')).toBe(false)
  })

  it('clears parameters and resets filter controls', async () => {
    server.use(
      http.get(apiUrl('/project'), () =>
        HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        ),
      ),
    )
    const { user } = renderProjectsPage(
      '/projects?page=2&name=API&status=INACTIVE',
    )
    await screen.findByRole('heading', { name: 'No projects found' })

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => expect(currentSearch().toString()).toBe(''))
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Status')).toHaveValue('')
  })

  it('preserves filters when moving to the next page', async () => {
    const requests: URL[] = []
    const project = createProjectFixture()
    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        const url = new URL(request.url)
        requests.push(url)
        const currentPage = Number(url.searchParams.get('page'))
        return HttpResponse.json(
          createProjectCollection({
            projects: [project],
            meta: {
              ...baseMeta,
              currentPage,
              lastPage: 3,
              total: 21,
            },
          }),
        )
      }),
    )
    const { user } = renderProjectsPage(
      '/projects?page=1&name=API&status=ACTIVE',
    )
    await screen.findByText(project.name)

    await user.click(screen.getByRole('button', { name: 'Go to the next page' }))
    await waitFor(() => expect(requests).toHaveLength(2))

    expect(requests.at(-1)?.searchParams.get('page')).toBe('2')
    expect(requests.at(-1)?.searchParams.get('name')).toBe('API')
    expect(requests.at(-1)?.searchParams.get('status')).toBe('ACTIVE')
  })

  it('rehydrates filter inputs during history navigation', async () => {
    server.use(
      http.get(apiUrl('/project'), () =>
        HttpResponse.json(
          createProjectCollection({ projects: [], meta: baseMeta }),
        ),
      ),
    )
    const { user } = renderProjectsPage('/projects?name=Alpha', true)
    await screen.findByRole('heading', { name: 'No projects found' })
    expect(screen.getByLabelText('Name')).toHaveValue('Alpha')

    await user.click(screen.getByRole('button', { name: 'Open Beta' }))
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Beta'))

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Alpha'))
  })
})

describe('ProjectsPage creation', () => {
  it('refetches the list, closes the dialog, and resets after creation', async () => {
    const projects = [] as ReturnType<typeof createProjectFixture>[]
    const createdProject = createProjectFixture({ name: 'Created project' })
    let submittedBody: unknown
    server.use(
      http.get(apiUrl('/project'), () =>
        HttpResponse.json(
          createProjectCollection({
            projects,
            meta: { ...baseMeta, total: projects.length },
          }),
        ),
      ),
      http.post(apiUrl('/project'), async ({ request }) => {
        submittedBody = await request.json()
        projects.push(createdProject)
        return HttpResponse.json(createdProject, { status: 201 })
      }),
    )
    const { user } = renderProjectsPage()
    await screen.findByRole('heading', { name: 'No projects found' })

    await user.click(screen.getByRole('button', { name: 'New project' }))
    const dialog = screen.getByRole('dialog', { name: 'New project' })
    await user.type(within(dialog).getByLabelText('Name'), createdProject.name)
    await user.type(within(dialog).getByLabelText('Description'), 'New record')
    await user.click(
      within(dialog).getByRole('button', { name: 'Create project' }),
    )

    expect(await screen.findByText(createdProject.name)).toBeVisible()
    expect(
      screen.queryByRole('dialog', { name: 'New project' }),
    ).not.toBeInTheDocument()
    expect(submittedBody).toEqual({
      name: createdProject.name,
      description: 'New record',
    })

    await user.click(screen.getByRole('button', { name: 'New project' }))
    const reopenedDialog = screen.getByRole('dialog', { name: 'New project' })
    expect(within(reopenedDialog).getByLabelText('Name')).toHaveValue('')
    expect(within(reopenedDialog).getByLabelText('Description')).toHaveValue('')
  })
})
