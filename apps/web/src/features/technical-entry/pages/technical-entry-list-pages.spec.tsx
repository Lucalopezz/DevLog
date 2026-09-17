import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { technicalEntriesKeys } from '../api/list-technical-entries'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import TechnicalEntriesPage from './technical-entries-page'
import ArchivedTechnicalEntriesPage from './technical-entry-archived-page'

const issue = createTechnicalEntry({
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Connection timeout',
  type: 'ISSUE',
  status: 'RESOLVED',
  tags: [{ id: 'tag-1', name: 'database' }],
})
const baseMeta = { currentPage: 1, perPage: 10, lastPage: 1, total: 0 }
const cases = [
  { label: 'active', route: '/technical-entries', scope: 'null', empty: 'No technical entries found' },
  { label: 'archived', route: '/technical-entries/archived', scope: 'not-null', empty: 'No archived technical entries found' },
] as const

function collection(entries = [issue], meta = { ...baseMeta, total: entries.length }) {
  return { data: entries, meta }
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current search">{location.search}</output>
}

function HistoryControls({ route }: { route: string }) {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate(`${route}?title=Beta`)} type="button">Open Beta</button>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  )
}

function renderList(route: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/technical-entries" element={<TechnicalEntriesPage />} />
        <Route path="/technical-entries/archived" element={<ArchivedTechnicalEntriesPage />} />
      </Routes>
      <LocationProbe />
      <HistoryControls route={route.split('?')[0]} />
    </>,
    { route },
  )
}

function search() {
  return new URLSearchParams(screen.getByLabelText('Current search').textContent ?? '')
}

describe.each(cases)('$label technical-entry list', ({ route, scope, empty }) => {
  it('requests its fixed archive scope and renders a card with optional metadata', async () => {
    let requested: URL | undefined
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      requested = new URL(request.url)
      return HttpResponse.json(collection())
    }))
    renderList(route)
    const title = await screen.findByText(issue.title)
    expect(title.closest('a')).toHaveAttribute('href', `/technical-entries/${issue.id}`)
    expect(screen.getByText('#database')).toBeVisible()
    expect(within(title.closest('article')!).getByText('Resolved')).toBeVisible()
    expect(within(title.closest('article')!).getByText(issue.conclusion!)).toBeVisible()
    expect(screen.getByText(/Updated/)).toBeVisible()
    expect(Object.fromEntries(requested?.searchParams ?? [])).toEqual({
      perPage: '10', archivedAt: scope, sort: 'createdAt', sortDir: 'desc', page: '1',
    })
  })

  it('shows a pending skeleton, an empty result, and a retryable error', async () => {
    const gate = deferred<void>()
    let attempts = 0
    server.use(http.get(apiUrl('/technical-entry'), async () => {
      attempts += 1
      if (attempts === 1) {
        await gate.promise
        return HttpResponse.json(collection([]))
      }
      if (attempts === 2) return HttpResponse.json({ message: 'Offline' }, { status: 500 })
      return HttpResponse.json(collection([issue]))
    }))
    const { user, client } = renderList(route)
    try {
      expect(screen.getByRole('status', { name: 'Loading technical entries' })).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByRole('heading', { name: empty })).toBeVisible()
    // A distinct search key produces an initial error state, rather than
    // retaining an older empty result while a background refetch fails.
    await user.click(screen.getByRole('button', { name: 'Open Beta' }))
    expect(await screen.findByRole('heading', { name: 'Could not load technical entries' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(issue.title)).toBeVisible()
    expect(client.getQueryCache().getAll().length).toBeGreaterThan(1)
  })

  it.each([null, '0', '-1', '1.5', 'NaN', 'missing'])(
    'normalizes page %s to one without losing archive scope',
    async (page) => {
      let requested: URL | undefined
      server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json(collection([]))
      }))
      renderList(page === null ? route : `${route}?page=${page}`)
      await screen.findByRole('heading', { name: empty })
      expect(requested?.searchParams.get('page')).toBe('1')
      expect(requested?.searchParams.get('archivedAt')).toBe(scope)
    },
  )

  it('applies valid URL filters while dropping unknown values and LEARNING status', async () => {
    const requests: URL[] = []
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(collection([]))
    }))
    const { user } = renderList(`${route}?page=4&title=%20Pool%20&type=LEARNING&status=OPEN`)
    await screen.findByRole('heading', { name: empty })
    expect(requests.at(-1)?.searchParams.get('page')).toBe('4')
    expect(requests.at(-1)?.searchParams.get('title')).toBe('Pool')
    expect(requests.at(-1)?.searchParams.get('type')).toBe('LEARNING')
    expect(requests.at(-1)?.searchParams.has('status')).toBe(false)
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Open Beta' }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('title')).toBe('Beta'))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Beta')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Pool'))
  })

  it('omits unknown type and status values from HTTP', async () => {
    let requested: URL | undefined
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      requested = new URL(request.url)
      return HttpResponse.json(collection([]))
    }))
    renderList(`${route}?type=EXPERIMENT&status=PENDING`)
    await screen.findByRole('heading', { name: empty })
    expect(requested?.searchParams.has('type')).toBe(false)
    expect(requested?.searchParams.has('status')).toBe(false)
    expect(requested?.searchParams.get('archivedAt')).toBe(scope)
  })

  it('omits optional card fields and removes All filters from the request', async () => {
    const requests: URL[] = []
    const learning = createTechnicalEntry({
      title: 'A learning without extras',
      type: 'LEARNING',
      status: undefined,
      tags: undefined,
      conclusion: undefined,
    })
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(collection([learning]))
    }))
    const { user } = renderList(`${route}?type=ISSUE&status=RESOLVED`)
    const card = (await screen.findByText(learning.title)).closest('article')!
    expect(within(card).queryByText('Conclusion')).toBeNull()
    expect(within(card).queryByText(/#/)).toBeNull()
    expect(within(card).queryByText('Resolved')).toBeNull()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), '')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests.at(-1)?.searchParams.has('type')).toBe(false)
    expect(requests.at(-1)?.searchParams.has('status')).toBe(false)
  })

  it('keeps filters as drafts until Search, resets page, and omits status for Learning', async () => {
    const requests: URL[] = []
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(collection([]))
    }))
    const { user } = renderList(`${route}?page=3&type=ISSUE&status=OPEN`)
    await screen.findByRole('heading', { name: empty })
    const form = screen.getByRole('form', { name: 'Search filters' })
    await user.type(within(form).getByRole('textbox', { name: 'Title' }), '  Pool  ')
    expect(requests).toHaveLength(1)
    await user.selectOptions(within(form).getByRole('combobox', { name: 'Type' }), 'LEARNING')
    expect(within(form).getByRole('combobox', { name: 'Status' })).toBeDisabled()
    await user.click(within(form).getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(search().get('page')).toBe('1')
    expect(requests.at(-1)?.searchParams.get('title')).toBe('Pool')
    expect(requests.at(-1)?.searchParams.get('type')).toBe('LEARNING')
    expect(requests.at(-1)?.searchParams.has('status')).toBe(false)
    expect(requests.at(-1)?.searchParams.get('archivedAt')).toBe(scope)
    // Search replaces the keyed filter form, so fetch its current DOM node.
    await user.click(within(screen.getByRole('form', { name: 'Search filters' })).getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('type')).toBe(false))
    expect(requests.at(-1)?.searchParams.get('archivedAt')).toBe(scope)
  })

  it('preserves filters across pagination and disables boundary controls', async () => {
    const requests: URL[] = []
    server.use(http.get(apiUrl('/technical-entry'), ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      const page = Number(url.searchParams.get('page'))
      return HttpResponse.json(collection([issue], {
        currentPage: page, perPage: 10, lastPage: 2, total: 11,
      }))
    }))
    const { user } = renderList(`${route}?title=Pool&type=ISSUE&status=OPEN`)
    await screen.findByText(issue.title)
    expect(screen.getByRole('button', { name: 'Go to the previous page' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Go to the next page' }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('2'))
    expect(requests.at(-1)?.searchParams.get('title')).toBe('Pool')
    expect(requests.at(-1)?.searchParams.get('type')).toBe('ISSUE')
    expect(requests.at(-1)?.searchParams.get('status')).toBe('OPEN')
    expect(requests.at(-1)?.searchParams.get('archivedAt')).toBe(scope)
    expect(await screen.findByRole('button', { name: 'Go to the next page' })).toBeDisabled()
  })

  it('disables pagination while refreshing an already visible list', async () => {
    const gate = deferred<void>()
    let requests = 0
    server.use(http.get(apiUrl('/technical-entry'), async () => {
      requests += 1
      if (requests > 1) await gate.promise
      return HttpResponse.json(collection([issue], {
        currentPage: 1, perPage: 10, lastPage: 2, total: 11,
      }))
    }))
    const { client } = renderList(route)
    await screen.findByText(issue.title)
    try {
      await act(async () => {
        void client.invalidateQueries({ queryKey: technicalEntriesKeys.lists() })
      })
      expect(await screen.findByRole('button', { name: 'Go to the next page' })).toBeDisabled()
      expect(screen.getByText(issue.title)).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.getByRole('button', { name: 'Go to the next page' })).toBeEnabled())
  })
})

it('never treats the archive route as a technical-entry ID', async () => {
  let detailRequests = 0
  server.use(
    http.get(apiUrl('/technical-entry'), () => HttpResponse.json(collection([]))),
    http.get(apiUrl('/technical-entry/archived'), () => {
      detailRequests += 1
      return HttpResponse.json(issue)
    }),
  )
  renderList('/technical-entries/archived')
  expect(await screen.findByRole('heading', { name: 'Archived technical entries' })).toBeVisible()
  expect(detailRequests).toBe(0)
})
