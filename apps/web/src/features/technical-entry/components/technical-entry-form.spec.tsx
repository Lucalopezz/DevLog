import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createTag } from '@/test/factories/tag'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { TechnicalEntryForm } from './technical-entry-form'

const projectId = '22222222-2222-4222-8222-222222222222'
const reactTag = createTag({ id: '44444444-4444-4444-8444-444444444444', name: 'React' })
const dockerTag = createTag({ id: '55555555-5555-4555-8555-555555555555', name: 'Docker' })

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
  beforeEach(() => {
    // The form renders TagSelector even when a test is focused on entry fields.
    // Give that selector an explicit response so these tests remain isolated
    // from the real tag service.
    server.use(http.get(apiUrl('/tag'), () => HttpResponse.json({
      data: [reactTag, dockerTag],
      meta: { currentPage: 1, perPage: 100, lastPage: 1, total: 2 },
    })))
  })

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

  it('creates the entry before assigning two selected tags', async () => {
    const events: string[] = []
    const assignmentIds: string[] = []
    const entry = createTechnicalEntry({ tags: [] })

    server.use(
      http.post(apiUrl('/technical-entry'), () => {
        events.push('entry')
        return HttpResponse.json(entry, { status: 201 })
      }),
      http.post(apiUrl(`/technical-entry/${entry.id}/tags`), async ({ request }) => {
        const body = await request.json() as { tagId: string }
        events.push(`tag:${body.tagId}`)
        assignmentIds.push(body.tagId)
        return HttpResponse.json(body.tagId === reactTag.id ? reactTag : dockerTag, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<Harness />)
    const dialog = await fillRequired(user)
    await user.click(within(dialog).getByRole('button', { name: 'Choose tags' }))
    const picker = screen.getByRole('dialog', { name: 'Select tags' })
    await user.click(await within(picker).findByRole('button', { name: '#React' }))
    await user.click(await within(picker).findByRole('button', { name: '#Docker' }))
    await user.click(within(picker).getByRole('button', { name: 'Close' }))
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))

    await waitFor(() => expect(assignmentIds).toHaveLength(2))
    expect(events[0]).toBe('entry')
    expect(assignmentIds).toEqual(expect.arrayContaining([reactTag.id, dockerTag.id]))
  })

  it('waits for a newly created tag before creating and assigning the entry', async () => {
    const createdTag = createTag({
      id: '66666666-6666-4666-8666-666666666666',
      name: 'TypeScript',
    })
    const entry = createTechnicalEntry({ tags: [] })
    const events: string[] = []

    server.use(
      http.post(apiUrl('/tag'), () => {
        events.push('create-tag')
        return HttpResponse.json(createdTag, { status: 201 })
      }),
      http.post(apiUrl('/technical-entry'), () => {
        events.push('create-entry')
        return HttpResponse.json(entry, { status: 201 })
      }),
      http.post(apiUrl(`/technical-entry/${entry.id}/tags`), async ({ request }) => {
        const body = await request.json() as { tagId: string }
        events.push(`assign-tag:${body.tagId}`)
        return HttpResponse.json(createdTag, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<Harness />)
    const entryDialog = await fillRequired(user)
    await user.click(within(entryDialog).getByRole('button', { name: 'Choose tags' }))
    const picker = screen.getByRole('dialog', { name: 'Select tags' })
    await user.click(within(picker).getByRole('button', { name: 'Create new tag' }))

    const tagDialog = screen.getByRole('dialog', { name: 'New tag' })
    await user.type(within(tagDialog).getByRole('textbox', { name: 'Name' }), createdTag.name)
    await user.click(within(tagDialog).getByRole('button', { name: 'Create tag' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New tag' })).toBeNull())
    expect(events).toEqual(['create-tag'])

    await user.click(within(picker).getByRole('button', { name: 'Close' }))
    expect(within(entryDialog).getByText(`#${createdTag.name}`)).toBeVisible()
    await user.click(within(entryDialog).getByRole('button', { name: 'Create entry' }))

    await waitFor(() =>
      expect(events).toEqual([
        'create-tag',
        'create-entry',
        `assign-tag:${createdTag.id}`,
      ]),
    )
  })

  it('reports a partial result when one tag assignment fails', async () => {
    const assignmentIds: string[] = []
    const entry = createTechnicalEntry({ tags: [] })

    server.use(
      http.post(apiUrl('/technical-entry'), () =>
        HttpResponse.json(entry, { status: 201 }),
      ),
      http.post(apiUrl(`/technical-entry/${entry.id}/tags`), async ({ request }) => {
        const body = await request.json() as { tagId: string }
        assignmentIds.push(body.tagId)
        if (body.tagId === dockerTag.id) {
          return HttpResponse.json({ message: 'Could not assign tag' }, { status: 500 })
        }
        return HttpResponse.json(reactTag, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<Harness />)
    const dialog = await fillRequired(user)
    await user.click(within(dialog).getByRole('button', { name: 'Choose tags' }))
    const picker = screen.getByRole('dialog', { name: 'Select tags' })
    await user.click(await within(picker).findByRole('button', { name: '#React' }))
    await user.click(await within(picker).findByRole('button', { name: '#Docker' }))
    await user.click(within(picker).getByRole('button', { name: 'Close' }))
    await user.click(within(dialog).getByRole('button', { name: 'Create entry' }))

    expect(await screen.findByText('The entry was created, but some tags could not be assigned.')).toBeVisible()
    expect(assignmentIds).toEqual(expect.arrayContaining([reactTag.id, dockerTag.id]))
  })
})
