import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useGetProject } from '../hooks/use-get-project'
import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { ProjectInlineContent } from './project-inline-content'

const initial = createProjectFixture({ description: '**Original description**' })

function Harness() {
  const query = useGetProject(initial.id)
  return query.data ? <ProjectInlineContent project={query.data} /> : <p>Loading project</p>
}

function installGet() {
  let project = initial
  server.use(
    http.get(apiUrl(`/project/${initial.id}`), () => HttpResponse.json(project)),
    http.patch(apiUrl(`/project/${initial.id}`), async ({ request }) => {
      const body = await request.json() as { description: string | null }
      project = { ...project, description: body.description ?? undefined }
      return HttpResponse.json(project)
    }),
  )
  return { setProject: (next: typeof project) => { project = next } }
}

describe('ProjectInlineContent', () => {
  it('shows Markdown and restores the server value after Cancel', async () => {
    installGet()
    const { user } = renderWithProviders(<Harness />)
    expect(await screen.findByText('Original description')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    await user.clear(screen.getByRole('textbox', { name: 'Project description' }))
    await user.type(screen.getByRole('textbox', { name: 'Project description' }), 'Unsaved draft')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Original description')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    expect(screen.getByRole('textbox', { name: 'Project description' })).toHaveValue(initial.description)
  })

  it('clears whitespace-only content with null and shows the refetched empty state', async () => {
    let body: unknown
    let current = initial
    server.use(
      http.get(apiUrl(`/project/${initial.id}`), () => HttpResponse.json(current)),
      http.patch(apiUrl(`/project/${initial.id}`), async ({ request }) => {
        body = await request.json()
        current = { ...current, description: undefined }
        return HttpResponse.json({ ...current, description: null })
      }),
    )
    const { user } = renderWithProviders(<Harness />)
    await screen.findByText('Original description')
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    await user.clear(screen.getByRole('textbox', { name: 'Project description' }))
    await user.type(screen.getByRole('textbox', { name: 'Project description' }), '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('No project description has been recorded yet.')).toBeVisible()
    expect(body).toEqual({ description: null })
  })

  it('keeps the draft during a failed PATCH and allows a retry', async () => {
    let current = initial
    let attempts = 0
    server.use(
      http.get(apiUrl(`/project/${initial.id}`), () => HttpResponse.json(current)),
      http.patch(apiUrl(`/project/${initial.id}`), async ({ request }) => {
        attempts += 1
        if (attempts === 1) return HttpResponse.json({ message: 'Save failed' }, { status: 500 })
        const body = await request.json() as { description: string }
        current = { ...current, description: body.description }
        return HttpResponse.json(current)
      }),
    )
    const { user } = renderWithProviders(<Harness />)
    await screen.findByText('Original description')
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    await user.clear(screen.getByRole('textbox', { name: 'Project description' }))
    await user.type(screen.getByRole('textbox', { name: 'Project description' }), 'Recovered value')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Save failed')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Project description' })).toHaveValue('Recovered value')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Recovered value')).toBeVisible()
    expect(attempts).toBe(2)
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    expect(screen.getByRole('textbox', { name: 'Project description' })).toHaveValue('Recovered value')
  })

  it('disables the editor while saving', async () => {
    installGet()
    const gate = deferred<void>()
    server.use(http.patch(apiUrl(`/project/${initial.id}`), async () => {
      await gate.promise
      return HttpResponse.json(initial)
    }))
    const { user } = renderWithProviders(<Harness />)
    await screen.findByText('Original description')
    await user.click(screen.getByRole('button', { name: 'Edit project description' }))
    try {
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(await screen.findByRole('button', { name: 'Saving...' })).toBeDisabled()
      expect(screen.getByRole('textbox', { name: 'Project description' })).toBeDisabled()
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Saving...' })).toBeNull())
  })

  it('does not offer editing for an archived project', async () => {
    server.use(http.get(apiUrl(`/project/${initial.id}`), () =>
      HttpResponse.json({ ...initial, archivedAt: '2026-09-15T12:00:00Z' }),
    ))
    renderWithProviders(<Harness />)
    expect(await screen.findByText('Original description')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Edit project description' })).toBeNull()
  })
})
