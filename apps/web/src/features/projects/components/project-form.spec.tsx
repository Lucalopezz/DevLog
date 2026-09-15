import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { deferred } from '@/test/deferred'
import { createProjectFixture } from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { renderWithProviders } from '@/test/render-with-providers'

import { ProjectForm } from './project-form'

function ProjectFormHarness() {
  const [open, setOpen] = useState(true)

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open project form
      </button>
      <ProjectForm open={open} onOpenChange={setOpen} />
    </>
  )
}

describe('ProjectForm', () => {
  it('renders an accessible dialog with labeled fields', () => {
    renderWithProviders(<ProjectFormHarness />)

    const dialog = screen.getByRole('dialog', { name: 'New project' })
    expect(dialog).toHaveAccessibleDescription(
      'Create a project to organize it in DevLog.',
    )
    expect(within(dialog).getByLabelText('Name')).toBeVisible()
    expect(within(dialog).getByLabelText('Description')).toBeVisible()
  })

  it('blocks invalid data before POST', async () => {
    let postCount = 0
    server.use(
      http.post(apiUrl('/project'), () => {
        postCount += 1
        return HttpResponse.json(createProjectFixture(), { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<ProjectFormHarness />)
    const dialog = screen.getByRole('dialog', { name: 'New project' })

    await user.type(within(dialog).getByLabelText('Name'), 'No')
    await user.click(
      within(dialog).getByRole('button', { name: 'Create project' }),
    )

    expect(await within(dialog).findByText(/at least 3 characters/)).toBeVisible()
    expect(postCount).toBe(0)
  })

  it('sends valid data, disables fields, then resets and closes', async () => {
    const responseGate = deferred<void>()
    let submittedBody: unknown
    server.use(
      http.post(apiUrl('/project'), async ({ request }) => {
        submittedBody = await request.json()
        await responseGate.promise
        return HttpResponse.json(createProjectFixture(), { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<ProjectFormHarness />)
    const dialog = screen.getByRole('dialog', { name: 'New project' })

    try {
      await user.type(within(dialog).getByLabelText('Name'), 'DevLog Web')
      await user.type(
        within(dialog).getByLabelText('Description'),
        'Frontend study project',
      )
      await user.click(
        within(dialog).getByRole('button', { name: 'Create project' }),
      )

      expect(
        await within(dialog).findByRole('button', { name: 'Creating...' }),
      ).toBeDisabled()
      expect(within(dialog).getByLabelText('Name')).toBeDisabled()
      expect(within(dialog).getByLabelText('Description')).toBeDisabled()
    } finally {
      responseGate.resolve(undefined)
    }

    expect(
      await screen.findByText('Project created successfully!'),
    ).toBeVisible()
    expect(
      screen.queryByRole('dialog', { name: 'New project' }),
    ).not.toBeInTheDocument()
    expect(submittedBody).toEqual({
      name: 'DevLog Web',
      description: 'Frontend study project',
    })

    await user.click(screen.getByRole('button', { name: 'Open project form' }))
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
  })

  it.each([
    [
      '409',
      HttpResponse.json({ message: 'Project already exists.' }, { status: 409 }),
      'Project already exists.',
    ],
    [
      '422',
      HttpResponse.json({ message: ['Invalid project input.'] }, { status: 422 }),
      'Invalid project input.',
    ],
    [
      '500',
      HttpResponse.json({}, { status: 500 }),
      'Could not create the project. Try again.',
    ],
    [
      'network',
      HttpResponse.error(),
      'Could not create the project. Try again.',
    ],
  ] as const)('retains the draft after a %s failure', async (_case, response, message) => {
    server.use(http.post(apiUrl('/project'), () => response))
    const { user } = renderWithProviders(<ProjectFormHarness />)
    const dialog = screen.getByRole('dialog', { name: 'New project' })

    await user.type(within(dialog).getByLabelText('Name'), 'Retained project')
    await user.type(within(dialog).getByLabelText('Description'), 'Keep this')
    await user.click(
      within(dialog).getByRole('button', { name: 'Create project' }),
    )

    expect(
      await within(dialog).findByRole('button', { name: 'Create project' }),
    ).toBeEnabled()
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Retained project')
    expect(within(dialog).getByLabelText('Description')).toHaveValue('Keep this')
    expect((await screen.findAllByText(message)).at(-1)).toBeVisible()
  })
})
