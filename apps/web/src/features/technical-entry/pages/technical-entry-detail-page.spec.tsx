import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import TechnicalEntryDetailPage from './technical-entry-detail-page'

const initial = createTechnicalEntry({
  title: 'Connection pooling',
  type: 'ISSUE',
  status: 'RESOLVED',
  tags: [{ id: 'tag-1', name: 'database' }],
})

function installGet(entry = initial) {
  let current = entry
  server.use(http.get(apiUrl(`/technical-entry/${initial.id}`), () => HttpResponse.json(current)))
  return {
    get: () => current,
    set: (next: typeof current) => { current = next },
  }
}

function installTagList() {
  server.use(http.get(apiUrl('/tag'), () => HttpResponse.json({
    data: [],
    meta: { currentPage: 1, perPage: 100, lastPage: 1, total: 0 },
  })))
}

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/technical-entries/:technicalEntryId" element={<TechnicalEntryDetailPage />} />
      <Route path="/technical-entries" element={<p>Journal destination</p>} />
    </Routes>,
    { route: `/technical-entries/${initial.id}` },
  )
}

describe('TechnicalEntryDetailPage', () => {
  beforeEach(installTagList)

  it('shows pending, then the entry fields and linked project', async () => {
    const gate = deferred<void>()
    server.use(http.get(apiUrl(`/technical-entry/${initial.id}`), async () => {
      await gate.promise
      return HttpResponse.json(initial)
    }))
    try {
      renderDetail()
      expect(screen.getByRole('status', { name: 'Loading technical entry' })).toBeVisible()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByRole('heading', { name: initial.title })).toBeVisible()
    expect(screen.getByRole('link', { name: 'View project' })).toHaveAttribute('href', `/projects/${initial.projectId}`)
    expect(screen.getByText('#database')).toBeVisible()
    expect(screen.getByText(initial.context)).toBeVisible()
    expect(screen.getByText(initial.conclusion!)).toBeVisible()
    expect(screen.queryByText('Archived')).toBeNull()
  })

  it('renders a 404 and a link back to the journal', async () => {
    server.use(http.get(apiUrl(`/technical-entry/${initial.id}`), () =>
      HttpResponse.json({ message: 'Not found' }, { status: 404 }),
    ))
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Technical entry not found' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to technical entries' })).toHaveAttribute('href', '/technical-entries')
  })

  it('omits optional project, tags, conclusion and status when absent', async () => {
    installGet(createTechnicalEntry({
      projectId: undefined, tags: undefined, conclusion: undefined,
      type: 'LEARNING', status: undefined,
    }))
    renderDetail()
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    expect(screen.queryByRole('link', { name: 'View project' })).toBeNull()
    expect(screen.getByText('No tags selected.')).toBeVisible()
    expect(screen.queryByText('#database')).toBeNull()
    expect(screen.getByText('No conclusion has been recorded yet.')).toBeVisible()
  })

  it('validates title, sends a title-only PATCH, and reopens with refreshed data', async () => {
    const state = installGet()
    let body: unknown
    server.use(http.patch(apiUrl(`/technical-entry/${initial.id}`), async ({ request }) => {
      body = await request.json()
      const next = { ...state.get(), ...(body as object), updatedAt: '2026-09-16T13:00:00Z' }
      state.set(next)
      return HttpResponse.json(next)
    }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: initial.title })
    await user.click(screen.getByRole('button', { name: 'Edit entry' }))
    let dialog = screen.getByRole('dialog', { name: 'Edit technical entry' })
    const input = within(dialog).getByRole('textbox', { name: 'Title' })
    expect(input).toHaveValue(initial.title)
    await user.clear(input)
    await user.type(input, 'x')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(dialog).findByText('Title must be at least 3 characters long')).toBeVisible()
    expect(body).toBeUndefined()
    await user.clear(input)
    await user.type(input, '  Updated connection pooling  ')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(body).toEqual({ title: 'Updated connection pooling' }))
    expect(await screen.findByRole('heading', { name: 'Updated connection pooling' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Edit entry' }))
    dialog = screen.getByRole('dialog', { name: 'Edit technical entry' })
    expect(within(dialog).getByRole('textbox', { name: 'Title' })).toHaveValue('Updated connection pooling')
  })

  it('keeps the title draft after a failed PATCH and allows retry', async () => {
    const state = installGet()
    let attempts = 0
    server.use(http.patch(apiUrl(`/technical-entry/${initial.id}`), async ({ request }) => {
      attempts += 1
      if (attempts === 1) return HttpResponse.json({ message: 'Save failed' }, { status: 500 })
      const next = { ...state.get(), ...(await request.json() as object) }
      state.set(next)
      return HttpResponse.json(next)
    }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: initial.title })
    await user.click(screen.getByRole('button', { name: 'Edit entry' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit technical entry' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Title' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Retry title')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Save failed')).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Title' })).toHaveValue('Retry title')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('heading', { name: 'Retry title' })).toBeVisible()
    expect(attempts).toBe(2)
  })

  it('validates context and patches only that field', async () => {
    const state = installGet()
    let body: unknown
    server.use(http.patch(apiUrl(`/technical-entry/${initial.id}`), async ({ request }) => {
      body = await request.json()
      const next = { ...state.get(), ...(body as object) }
      state.set(next)
      return HttpResponse.json(next)
    }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: initial.title })
    await user.click(screen.getByRole('button', { name: 'Edit context' }))
    const input = screen.getByRole('textbox', { name: 'Context' })
    await user.clear(input)
    await user.type(input, 'x')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Context must be at least 3 characters long')).toBeVisible()
    expect(body).toBeUndefined()
    await user.clear(input)
    await user.type(input, 'Updated context')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Updated context')).toBeVisible()
    expect(body).toEqual({ context: 'Updated context' })
    await user.click(screen.getByRole('button', { name: 'Edit context' }))
    expect(screen.getByRole('textbox', { name: 'Context' })).toHaveValue('Updated context')
  })

  it('clears only the conclusion with null and reads the refreshed value', async () => {
    const state = installGet()
    let body: unknown
    server.use(http.patch(apiUrl(`/technical-entry/${initial.id}`), async ({ request }) => {
      body = await request.json()
      const next = { ...state.get(), conclusion: undefined }
      state.set(next)
      return HttpResponse.json(next)
    }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: initial.title })
    await user.click(screen.getByRole('button', { name: 'Edit conclusion' }))
    await user.clear(screen.getByRole('textbox', { name: 'Conclusion' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('No conclusion has been recorded yet.')).toBeVisible()
    expect(body).toEqual({ conclusion: null })
    expect(state.get().context).toBe(initial.context)
  })

  it('cancels inline edits and keeps a failed draft for retry', async () => {
    const state = installGet()
    let attempts = 0
    server.use(http.patch(apiUrl(`/technical-entry/${initial.id}`), async ({ request }) => {
      attempts += 1
      if (attempts === 1) return HttpResponse.json({ message: 'Save failed' }, { status: 500 })
      const next = { ...state.get(), ...(await request.json() as object) }
      state.set(next)
      return HttpResponse.json(next)
    }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: initial.title })
    await user.click(screen.getByRole('button', { name: 'Edit conclusion' }))
    await user.clear(screen.getByRole('textbox', { name: 'Conclusion' }))
    await user.type(screen.getByRole('textbox', { name: 'Conclusion' }), 'Discarded')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(attempts).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Edit conclusion' }))
    expect(screen.getByRole('textbox', { name: 'Conclusion' })).toHaveValue(initial.conclusion)
    await user.clear(screen.getByRole('textbox', { name: 'Conclusion' }))
    await user.type(screen.getByRole('textbox', { name: 'Conclusion' }), 'Final conclusion')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Save failed')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Conclusion' })).toHaveValue('Final conclusion')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Final conclusion')).toBeVisible()
  })

  it('allows title and inline edits on archived entries, per the current API rules', async () => {
    installGet(createTechnicalEntry({ archivedAt: '2026-09-16T12:00:00Z' }))
    const { user } = renderDetail()
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    expect(screen.getByRole('button', { name: 'Edit entry' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit context' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit conclusion' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete entry' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Edit entry' }))
    expect(screen.getByRole('dialog', { name: 'Edit technical entry' })).toBeVisible()
  })
})
