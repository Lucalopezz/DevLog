import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { TechnicalEntryForm } from './technical-entry-form'

const projectId = '22222222-2222-4222-8222-222222222222'

function Harness({ linked = false }: { linked?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">Open form</button>
      <TechnicalEntryForm open={open} onOpenChange={setOpen} projectId={linked ? projectId : undefined} />
    </>
  )
}

async function fillRequired(user: ReturnType<typeof renderWithProviders>['user']) {
  const dialog = screen.getByRole('dialog', { name: 'New technical entry' })
  await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Connection pooling')
  await user.type(within(dialog).getByRole('textbox', { name: 'Context' }), 'Investigate connection reuse.')
  return dialog
}

describe('TechnicalEntryForm', () => {
  it('defaults to Issue and rejects invalid input without POST', async () => {
    let requests = 0
    server.use(http.post(apiUrl('/technical-entry'), () => {
      requests += 1
      return HttpResponse.json(createTechnicalEntry())
    }))
    const { user } = renderWithProviders(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'New technical entry' })
    expect(within(dialog).getByRole('combobox', { name: 'Type' })).toHaveValue('ISSUE')
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
    expect(await within(dialog).findByText('Title must be at least 3 characters long')).toBeVisible()
    expect(within(dialog).getByText('Context must be at least 3 characters long')).toBeVisible()
    expect(requests).toBe(0)
  })

  it.each([
    ['global', false],
    ['project', true],
  ] as const)('creates a %s entry with the correct project association', async (_label, linked) => {
    let body: Record<string, unknown> | undefined
    server.use(http.post(apiUrl('/technical-entry'), async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(createTechnicalEntry({ projectId: linked ? projectId : undefined }), { status: 201 })
    }))
    const { user } = renderWithProviders(<Harness linked={linked} />)
    const dialog = await fillRequired(user)
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Type' }), 'LEARNING')
    await user.type(within(dialog).getByRole('textbox', { name: 'Conclusion' }), '  Reuse pooled connections.  ')
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
    await waitFor(() => expect(body).toEqual({
      title: 'Connection pooling',
      context: 'Investigate connection reuse.',
      type: 'LEARNING',
      conclusion: 'Reuse pooled connections.',
      ...(linked ? { projectId } : {}),
    }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Open form' }))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('')
  })

  it('omits a blank optional conclusion', async () => {
    let body: Record<string, unknown> | undefined
    server.use(http.post(apiUrl('/technical-entry'), async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(createTechnicalEntry(), { status: 201 })
    }))
    const { user } = renderWithProviders(<Harness />)
    const dialog = await fillRequired(user)
    await user.type(within(dialog).getByRole('textbox', { name: 'Conclusion' }), '   ')
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
    await waitFor(() => expect(body).toBeDefined())
    expect(body).not.toHaveProperty('conclusion')
  })

  it('disables fields and repeat submission while pending', async () => {
    const gate = deferred<void>()
    let requests = 0
    server.use(http.post(apiUrl('/technical-entry'), async () => {
      requests += 1
      await gate.promise
      return HttpResponse.json(createTechnicalEntry(), { status: 201 })
    }))
    const { user } = renderWithProviders(<Harness />)
    const dialog = await fillRequired(user)
    try {
      await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
      expect(await within(dialog).findByRole('button', { name: 'Creating...' })).toBeDisabled()
      expect(within(dialog).getByRole('textbox', { name: 'Title' })).toBeDisabled()
      expect(requests).toBe(1)
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('retains the draft after a rejected POST', async () => {
    server.use(http.post(apiUrl('/technical-entry'), () =>
      HttpResponse.json({ message: 'Could not create' }, { status: 500 }),
    ))
    const { user } = renderWithProviders(<Harness />)
    const dialog = await fillRequired(user)
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))
    expect(await screen.findByText('Could not create')).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Title' })).toHaveValue('Connection pooling')
  })
})
