import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { useProjectCommands, useProjectResources, useProjectTechnicalEntries } from '@/features/projects/hooks/use-project-details'
import { useDeleteProject } from '@/features/projects/hooks/use-project-lifecycle'
import type { TechnicalEntry } from '../types/technical-entry'
import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { useCreateTechnicalEntry } from './use-create-technical-entry'
import { useDeleteTechnicalEntry } from './use-delete-technical-entry'
import { useGetTechnicalEntry } from './use-get-technical-entry'
import { useTechnicalEntries } from './use-technical-entries'
import { technicalEntriesKeys } from '../api/list-technical-entries'
import { useArchiveTechnicalEntry, useRestoreTechnicalEntry } from './use-technical-entry-lifecycle'
import { useUpdateTechnicalEntry } from './use-update-technical-entry'

const projectId = '22222222-2222-4222-8222-222222222222'
const otherProjectId = '55555555-5555-4555-8555-555555555555'
const entryId = '33333333-3333-4333-8333-333333333333'
const createdId = '44444444-4444-4444-8444-444444444444'
const entry = createTechnicalEntry({ id: entryId, projectId, title: 'Original entry', type: 'ISSUE' })

function collection(entries: TechnicalEntry[]) {
  return {
    data: entries,
    meta: { currentPage: 1, perPage: 6, lastPage: 1, total: entries.length },
  }
}

function installJournalApi() {
  let entries = [entry]
  const calls = { commands: 0, resources: 0, projectEntries: 0, otherEntries: 0, otherCommands: 0, otherResources: 0 }
  server.use(
    http.get(apiUrl('/technical-entry'), ({ request }) => {
      const scope = new URL(request.url).searchParams.get('archivedAt')
      return HttpResponse.json(collection(entries.filter((item) =>
        scope === 'not-null' ? Boolean(item.archivedAt) : !item.archivedAt,
      )))
    }),
    http.get(apiUrl(`/project/${projectId}/technical-entries`), () => {
      calls.projectEntries += 1
      return HttpResponse.json(collection(entries.filter((item) =>
        item.projectId === projectId && !item.archivedAt,
      )))
    }),
    http.get(apiUrl(`/project/${projectId}/commands`), () => {
      calls.commands += 1
      return HttpResponse.json(collection([]))
    }),
    http.get(apiUrl(`/project/${projectId}/resources`), () => {
      calls.resources += 1
      return HttpResponse.json(collection([]))
    }),
    http.get(apiUrl(`/project/${otherProjectId}/technical-entries`), () => {
      calls.otherEntries += 1
      return HttpResponse.json(collection([]))
    }),
    http.get(apiUrl(`/project/${otherProjectId}/commands`), () => {
      calls.otherCommands += 1
      return HttpResponse.json(collection([]))
    }),
    http.get(apiUrl(`/project/${otherProjectId}/resources`), () => {
      calls.otherResources += 1
      return HttpResponse.json(collection([]))
    }),
    http.get(apiUrl(`/technical-entry/${entryId}`), () => {
      const found = entries.find((item) => item.id === entryId)
      return found
        ? HttpResponse.json(found)
        : HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }),
    http.post(apiUrl('/technical-entry'), async ({ request }) => {
      const input = await request.json() as Partial<TechnicalEntry>
      const created = createTechnicalEntry({ ...input, id: createdId, title: input.title! })
      entries = [created, ...entries]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(apiUrl(`/technical-entry/${entryId}`), async ({ request }) => {
      const input = await request.json() as Partial<TechnicalEntry>
      entries = entries.map((item) => item.id === entryId ? { ...item, ...input } : item)
      return HttpResponse.json(entries.find((item) => item.id === entryId))
    }),
    http.patch(apiUrl(`/technical-entry/${entryId}/archive`), () => {
      entries = entries.map((item) => item.id === entryId
        ? { ...item, archivedAt: '2026-09-16T12:00:00Z' } : item)
      return HttpResponse.json(entries.find((item) => item.id === entryId))
    }),
    http.patch(apiUrl(`/technical-entry/${entryId}/restore`), () => {
      entries = entries.map((item) => item.id === entryId
        ? { ...item, archivedAt: undefined } : item)
      return HttpResponse.json(entries.find((item) => item.id === entryId))
    }),
    http.delete(apiUrl(`/technical-entry/${entryId}`), () => {
      entries = entries.filter((item) => item.id !== entryId)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return { calls }
}

function JournalHarness() {
  const active = useTechnicalEntries({ page: 1, archivedAt: 'null' })
  const archived = useTechnicalEntries({ page: 1, archivedAt: 'not-null' })
  const project = useProjectTechnicalEntries(projectId)
  const commands = useProjectCommands(projectId)
  const resources = useProjectResources(projectId)
  const otherProject = useProjectTechnicalEntries(otherProjectId)
  const otherCommands = useProjectCommands(otherProjectId)
  const otherResources = useProjectResources(otherProjectId)
  const detail = useGetTechnicalEntry(entryId)
  const create = useCreateTechnicalEntry()
  const update = useUpdateTechnicalEntry()
  const archive = useArchiveTechnicalEntry()
  const restore = useRestoreTechnicalEntry()
  const remove = useDeleteTechnicalEntry()

  return (
    <>
      <output aria-label="Active entries">{active.data?.data.map((item) => item.title).join(', ') ?? 'Loading'}</output>
      <output aria-label="Archived entries">{archived.data?.data.map((item) => item.title).join(', ') ?? 'Loading'}</output>
      <output aria-label="Project entries">{project.data?.data.map((item) => item.title).join(', ') ?? 'Loading'}</output>
      <output aria-label="Project total">{project.data?.meta.total ?? 'Loading'}</output>
      <output aria-label="Detail title">{detail.data?.title ?? 'Unavailable'}</output>
      <output aria-label="Commands total">{commands.data?.meta.total ?? 'Loading'}</output>
      <output aria-label="Resources total">{resources.data?.meta.total ?? 'Loading'}</output>
      <output aria-label="Other project total">{otherProject.data?.meta.total ?? 'Loading'}</output>
      <output aria-label="Other commands total">{otherCommands.data?.meta.total ?? 'Loading'}</output>
      <output aria-label="Other resources total">{otherResources.data?.meta.total ?? 'Loading'}</output>
      <button onClick={() => create.mutate({ projectId, title: 'Created entry', context: 'Linked context', type: 'ISSUE' })} type="button">Create linked</button>
      <button onClick={() => update.mutate({ technicalEntryId: entryId, input: { title: 'Updated entry' } })} type="button">Update linked</button>
      <button onClick={() => archive.mutate(entryId)} type="button">Archive linked</button>
      <button onClick={() => restore.mutate(entryId)} type="button">Restore linked</button>
      <button onClick={() => remove.mutate(entryId)} type="button">Delete linked</button>
    </>
  )
}

function value(label: string) {
  return screen.getByLabelText(label).textContent
}

describe('journal cache synchronization', () => {
  it('synchronizes create, update, archive, restore and delete across global and project collections', async () => {
    const { calls } = installJournalApi()
    const { user, client } = renderWithProviders(<JournalHarness />)
    await waitFor(() => expect(value('Project total')).toBe('1'))
    await waitFor(() => expect(value('Commands total')).toBe('0'))
    await waitFor(() => expect(value('Resources total')).toBe('0'))
    await waitFor(() => expect(value('Other project total')).toBe('0'))
    await waitFor(() => expect(value('Other commands total')).toBe('0'))
    await waitFor(() => expect(value('Other resources total')).toBe('0'))
    expect(value('Active entries')).toBe('Original entry')
    expect(value('Archived entries')).toBe('')
    const unaffected = {
      commands: calls.commands,
      resources: calls.resources,
      otherEntries: calls.otherEntries,
      otherCommands: calls.otherCommands,
      otherResources: calls.otherResources,
    }

    await user.click(screen.getByRole('button', { name: 'Create linked' }))
    await waitFor(() => expect(value('Project total')).toBe('2'))
    expect(value('Active entries')).toContain('Created entry')

    await user.click(screen.getByRole('button', { name: 'Update linked' }))
    await waitFor(() => expect(value('Detail title')).toBe('Updated entry'))
    await waitFor(() => expect(value('Project entries')).toContain('Updated entry'))
    expect(value('Active entries')).toContain('Updated entry')
    expect(calls.commands).toBe(unaffected.commands)
    expect(calls.resources).toBe(unaffected.resources)
    expect(calls.otherEntries).toBe(unaffected.otherEntries)
    expect(calls.otherCommands).toBe(unaffected.otherCommands)
    expect(calls.otherResources).toBe(unaffected.otherResources)

    await user.click(screen.getByRole('button', { name: 'Archive linked' }))
    await waitFor(() => expect(value('Project total')).toBe('1'))
    expect(value('Active entries')).not.toContain('Updated entry')
    expect(value('Archived entries')).toContain('Updated entry')

    await user.click(screen.getByRole('button', { name: 'Restore linked' }))
    await waitFor(() => expect(value('Project total')).toBe('2'))
    expect(value('Active entries')).toContain('Updated entry')
    expect(value('Archived entries')).not.toContain('Updated entry')

    await user.click(screen.getByRole('button', { name: 'Delete linked' }))
    await waitFor(() => expect(value('Project total')).toBe('1'))
    expect(value('Active entries')).not.toContain('Updated entry')
    expect(client.getQueryData(['technical-entry', entryId])).toBeUndefined()
    expect(calls.projectEntries).toBeGreaterThan(4)
  })

  it('refreshes preserved entry associations after deleting a project', async () => {
    let current = entry
    let deleted = false
    server.use(
      http.get(apiUrl('/technical-entry'), () => HttpResponse.json(collection([current]))),
      http.get(apiUrl(`/technical-entry/${entryId}`), () => HttpResponse.json(current)),
      http.delete(apiUrl(`/project/${projectId}`), () => {
        deleted = true
        current = { ...current, projectId: undefined }
        return new HttpResponse(null, { status: 204 })
      }),
    )
    function ProjectDeletionHarness() {
      const active = useTechnicalEntries({ page: 1, archivedAt: 'null' })
      const detail = useGetTechnicalEntry(entryId)
      const remove = useDeleteProject()
      return (
        <>
          <output aria-label="List association">{active.data?.data[0]?.projectId ?? 'none'}</output>
          <output aria-label="Detail association">{detail.data?.projectId ?? 'none'}</output>
          <button onClick={() => remove.mutate(projectId)} type="button">Delete project</button>
        </>
      )
    }
    const { user } = renderWithProviders(<ProjectDeletionHarness />)
    await waitFor(() => expect(value('List association')).toBe(projectId))
    await waitFor(() => expect(value('Detail association')).toBe(projectId))
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    await waitFor(() => expect(deleted).toBe(true))
    await waitFor(() => expect(value('List association')).toBe('none'))
    expect(value('Detail association')).toBe('none')
  })

  it('updates an unlinked entry without requesting a project collection', async () => {
    const unlinked = createTechnicalEntry({ id: entryId, projectId: undefined, title: 'Unlinked entry' })
    let projectRequests = 0
    let current = unlinked
    server.use(
      http.get(apiUrl(`/technical-entry/${entryId}`), () => HttpResponse.json(current)),
      http.get(apiUrl('/technical-entry'), () => HttpResponse.json(collection([current]))),
      http.get(apiUrl(`/project/${projectId}/technical-entries`), () => {
        projectRequests += 1
        return HttpResponse.json(collection([]))
      }),
      http.patch(apiUrl(`/technical-entry/${entryId}`), () => {
        current = { ...current, title: 'Updated unlinked' }
        return HttpResponse.json(current)
      }),
    )
    function UnlinkedHarness() {
      const detail = useGetTechnicalEntry(entryId)
      const update = useUpdateTechnicalEntry()
      return (
        <>
          <output aria-label="Title">{detail.data?.title ?? 'Loading'}</output>
          <button onClick={() => update.mutate({ technicalEntryId: entryId, input: { title: 'Updated unlinked' } })} type="button">Update</button>
        </>
      )
    }
    const { user } = renderWithProviders(<UnlinkedHarness />)
    await waitFor(() => expect(value('Title')).toBe('Unlinked entry'))
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(value('Title')).toBe('Updated unlinked'))
    expect(projectRequests).toBe(0)
  })

  it('invalidates an inactive sibling list even when its cache is still fresh', async () => {
    let current = entry
    const secondPageParams = { page: 2, archivedAt: 'null', title: 'entry' }
    const secondPageKey = technicalEntriesKeys.list(secondPageParams)
    server.use(
      http.get(apiUrl('/technical-entry'), () => HttpResponse.json(collection([current]))),
      http.get(apiUrl(`/technical-entry/${entryId}`), () => HttpResponse.json(current)),
      http.patch(apiUrl(`/technical-entry/${entryId}`), () => {
        current = { ...current, title: 'Updated entry' }
        return HttpResponse.json(current)
      }),
    )
    function SecondPage() {
      const list = useTechnicalEntries(secondPageParams)
      return <output aria-label="Second page title">{list.data?.data[0]?.title ?? 'Loading'}</output>
    }
    function SiblingHarness() {
      const [showSecond, setShowSecond] = useState(false)
      const active = useTechnicalEntries({ page: 1, archivedAt: 'null' })
      useGetTechnicalEntry(entryId)
      const update = useUpdateTechnicalEntry()
      return (
        <>
          <output aria-label="First page title">{active.data?.data[0]?.title ?? 'Loading'}</output>
          <button onClick={() => update.mutate({ technicalEntryId: entryId, input: { title: 'Updated entry' } })} type="button">Update title</button>
          <button onClick={() => setShowSecond(true)} type="button">Open second page</button>
          {showSecond ? <SecondPage /> : null}
        </>
      )
    }
    const { user, client } = renderWithProviders(<SiblingHarness />)
    await waitFor(() => expect(value('First page title')).toBe('Original entry'))
    // Fresh inactive data would otherwise be reused without another GET.
    client.setQueryDefaults(secondPageKey, { staleTime: 60_000 })
    client.setQueryData(secondPageKey, collection([entry]))
    await user.click(screen.getByRole('button', { name: 'Update title' }))
    await waitFor(() => expect(value('First page title')).toBe('Updated entry'))
    expect(client.getQueryState(secondPageKey)?.isInvalidated).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Open second page' }))
    await waitFor(() => expect(value('Second page title')).toBe('Updated entry'))
  })
})
