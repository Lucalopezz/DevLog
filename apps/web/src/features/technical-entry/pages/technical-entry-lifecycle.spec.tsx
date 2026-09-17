import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import TechnicalEntryDetailPage from './technical-entry-detail-page'

const id = '33333333-3333-4333-8333-333333333333'

function JournalDestination() {
  const navigate = useNavigate()
  return (
    <>
      <p>Journal destination</p>
      <button onClick={() => navigate(`/technical-entries/${id}`)} type="button">
        Open deleted route
      </button>
    </>
  )
}

function renderLifecycle(archived = false) {
  let current = createTechnicalEntry({
    archivedAt: archived ? '2026-09-16T12:00:00Z' : undefined,
  })
  let deleted = false
  server.use(
    http.get(apiUrl(`/technical-entry/${id}`), () =>
      deleted
        ? HttpResponse.json({ message: 'Not found' }, { status: 404 })
        : HttpResponse.json(current),
    ),
    http.patch(apiUrl(`/technical-entry/${id}/archive`), () => {
      current = { ...current, archivedAt: '2026-09-16T12:00:00Z' }
      return HttpResponse.json(current)
    }),
    http.patch(apiUrl(`/technical-entry/${id}/restore`), () => {
      current = { ...current, archivedAt: undefined }
      return HttpResponse.json(current)
    }),
    http.delete(apiUrl(`/technical-entry/${id}`), () => {
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const result = renderWithProviders(
    <Routes>
      <Route path="/technical-entries/:technicalEntryId" element={<TechnicalEntryDetailPage />} />
      <Route path="/technical-entries" element={<JournalDestination />} />
    </Routes>,
    { route: `/technical-entries/${id}` },
  )
  return {
    ...result,
    setCurrent: (next: typeof current) => { current = next },
    markDeleted: () => { deleted = true },
  }
}

describe('technical-entry lifecycle', () => {
  it('cancels archive, disables repeat submission, then shows the archived state', async () => {
    const gate = deferred<void>()
    let patches = 0
    const { user, setCurrent } = renderLifecycle()
    server.use(http.patch(apiUrl(`/technical-entry/${id}/archive`), async () => {
      patches += 1
      await gate.promise
      const next = createTechnicalEntry({ archivedAt: '2026-09-16T12:00:00Z' })
      setCurrent(next)
      return HttpResponse.json(next)
    }))
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    await user.click(screen.getByRole('button', { name: 'Archive entry' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(patches).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Archive entry' }))
    dialog = await screen.findByRole('alertdialog')
    try {
      await user.click(within(dialog).getByRole('button', { name: 'Archive entry' }))
      await waitFor(() => expect(patches).toBe(1))
      expect(within(dialog).getByRole('button', { name: 'Archive entry' })).toBeDisabled()
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByRole('button', { name: 'Restore entry' })).toBeVisible()
    expect(screen.getByText('Archived')).toBeVisible()
  })

  it('keeps failed archive and restore confirmations available for retry', async () => {
    let archiveAttempts = 0
    let restoreAttempts = 0
    const { user, setCurrent } = renderLifecycle()
    server.use(
      http.patch(apiUrl(`/technical-entry/${id}/archive`), () => {
        archiveAttempts += 1
        if (archiveAttempts === 1) return HttpResponse.json({ message: 'Archive failed' }, { status: 500 })
        const next = createTechnicalEntry({ archivedAt: '2026-09-16T12:00:00Z' })
        setCurrent(next)
        return HttpResponse.json(next)
      }),
      http.patch(apiUrl(`/technical-entry/${id}/restore`), () => {
        restoreAttempts += 1
        if (restoreAttempts === 1) return HttpResponse.json({ message: 'Restore failed' }, { status: 500 })
        const next = createTechnicalEntry()
        setCurrent(next)
        return HttpResponse.json(next)
      }),
    )
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    await user.click(screen.getByRole('button', { name: 'Archive entry' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Archive entry' }))
    expect(await screen.findByText('Archive failed')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Archive entry' })).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Archive entry' }))
    await screen.findByRole('button', { name: 'Restore entry' })
    await user.click(screen.getByRole('button', { name: 'Restore entry' }))
    dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Restore entry' }))
    expect(await screen.findByText('Restore failed')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Restore entry' })).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Restore entry' }))
    expect(await screen.findByRole('button', { name: 'Archive entry' })).toBeVisible()
  })

  it('cancels restore without a PATCH, then restores an archived entry', async () => {
    let patches = 0
    const { user, setCurrent } = renderLifecycle(true)
    server.use(http.patch(apiUrl(`/technical-entry/${id}/restore`), () => {
      patches += 1
      const next = createTechnicalEntry()
      setCurrent(next)
      return HttpResponse.json(next)
    }))
    await screen.findByRole('button', { name: 'Restore entry' })
    await user.click(screen.getByRole('button', { name: 'Restore entry' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(patches).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Restore entry' }))
    dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Restore entry' }))
    expect(await screen.findByRole('button', { name: 'Archive entry' })).toBeVisible()
    expect(patches).toBe(1)
  })

  it('cancels delete, then deletes once and navigates without typed-name confirmation', async () => {
    const gate = deferred<void>()
    let deletes = 0
    const { user, markDeleted } = renderLifecycle()
    server.use(http.delete(apiUrl(`/technical-entry/${id}`), async () => {
      deletes += 1
      await gate.promise
      markDeleted()
      return new HttpResponse(null, { status: 204 })
    }))
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    await user.click(screen.getByRole('button', { name: 'Delete entry' }))
    let dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).queryByRole('textbox')).toBeNull()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(deletes).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Delete entry' }))
    dialog = await screen.findByRole('alertdialog')
    try {
      await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
      await waitFor(() => expect(deletes).toBe(1))
      expect(within(dialog).getByRole('button', { name: 'Delete permanently' })).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    expect(await screen.findByText('Journal destination')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Open deleted route' }))
    expect(await screen.findByRole('heading', { name: 'Technical entry not found' })).toBeVisible()
  })

  it('preserves delete confirmation when the server rejects it', async () => {
    const { user } = renderLifecycle(true)
    server.use(http.delete(apiUrl(`/technical-entry/${id}`), () =>
      HttpResponse.json({ message: 'Delete failed' }, { status: 500 }),
    ))
    await screen.findByRole('heading', { name: 'Understand query invalidation' })
    await user.click(screen.getByRole('button', { name: 'Delete entry' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
    expect(await screen.findByText('Delete failed')).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Delete permanently' })).toBeEnabled()
  })
})
