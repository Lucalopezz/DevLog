import { screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { ProjectEditForm } from './project-edit-form'

const project = createProjectFixture({
  description: 'Original description',
  localPath: '/workspace/devlog',
})

function Harness() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">Open editor</button>
      <ProjectEditForm open={open} onOpenChange={setOpen} project={project} />
    </>
  )
}

describe('ProjectEditForm', () => {
  it('prefills every field and sends normalized PATCH fields', async () => {
    let body: unknown
    server.use(http.patch(apiUrl(`/project/${project.id}`), async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...project, name: 'Updated project' })
    }))
    const { user } = renderWithProviders(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Edit project' })
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(project.name)
    expect(within(dialog).getByRole('textbox', { name: 'Description' })).toHaveValue(project.description)
    expect(within(dialog).getByRole('combobox', { name: 'Status' })).toHaveValue('ACTIVE')
    expect(within(dialog).getByRole('textbox', { name: 'Local path' })).toHaveValue(project.localPath)

    await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), '  Updated project  ')
    await user.clear(within(dialog).getByRole('textbox', { name: 'Description' }))
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Status' }), 'FINISHED')
    await user.clear(within(dialog).getByRole('textbox', { name: 'Local path' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(body).toEqual({
      name: 'Updated project',
      description: null,
      status: 'FINISHED',
      localPath: null,
    }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit project' })).toBeNull())
  })

  it('rejects an invalid name before PATCH', async () => {
    let requests = 0
    server.use(http.patch(apiUrl(`/project/${project.id}`), () => {
      requests += 1
      return HttpResponse.json(project)
    }))
    const { user } = renderWithProviders(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Edit project' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), ' x ')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(dialog).findByText('Name must be at least 3 characters long')).toBeVisible()
    expect(requests).toBe(0)
  })

  it('blocks repeat submission while pending, then closes on success', async () => {
    const gate = deferred<void>()
    let requests = 0
    server.use(http.patch(apiUrl(`/project/${project.id}`), async () => {
      requests += 1
      await gate.promise
      return HttpResponse.json(project)
    }))
    const { user } = renderWithProviders(<Harness />)
    try {
      await user.click(screen.getByRole('button', { name: 'Save changes' }))
      expect(await screen.findByRole('button', { name: 'Saving...' })).toBeDisabled()
      expect(requests).toBe(1)
    } finally {
      gate.resolve(undefined)
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('retains the draft and dialog after a server error', async () => {
    server.use(http.patch(apiUrl(`/project/${project.id}`), () =>
      HttpResponse.json({ message: 'Could not save' }, { status: 500 }),
    ))
    const { user } = renderWithProviders(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Edit project' })
    await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Draft project')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Could not save')).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Draft project')
  })
})
