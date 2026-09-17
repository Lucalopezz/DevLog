import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectFixture } from '@/test/factories/project'
import { renderWithProviders } from '@/test/render-with-providers'

import { ProjectSettingsPane } from './project-settings-pane'

const project = createProjectFixture({ localPath: '/workspace/devlog' })

describe('ProjectSettingsPane', () => {
  it('shows project metadata and the configured location', () => {
    renderWithProviders(<ProjectSettingsPane project={project} onEdit={() => {}} />)
    expect(screen.getByText(project.id)).toBeVisible()
    expect(screen.getByText(project.localPath!)).toBeVisible()
    expect(screen.getByText('Active project')).toBeVisible()
    expect(screen.getByText('Danger zone')).toBeVisible()
  })

  it('shows a missing-path message instead of an empty value', () => {
    renderWithProviders(
      <ProjectSettingsPane project={createProjectFixture({ localPath: undefined })} onEdit={() => {}} />,
    )
    expect(screen.getByText('No local path has been configured.')).toBeVisible()
  })

  it('copies the chosen value and resets feedback after 1.5 seconds', async () => {
    renderWithProviders(
      <ProjectSettingsPane project={project} onEdit={() => {}} />,
    )
    const location = screen.getByText(project.localPath!).closest('div')!
    const write = vi.spyOn(navigator.clipboard, 'writeText')
    vi.useFakeTimers()
    await act(async () => {
      fireEvent.click(within(location).getByRole('button', { name: 'Copy value' }))
    })
    expect(write).toHaveBeenCalledWith(project.localPath)
    expect(within(location).getByRole('button', { name: 'Copied' })).toBeVisible()
    act(() => vi.advanceTimersByTime(1500))
    expect(within(location).getByRole('button', { name: 'Copy value' })).toBeVisible()
  })

  it('reports a rejected clipboard write without showing success feedback', async () => {
    const { user } = renderWithProviders(
      <ProjectSettingsPane project={project} onEdit={() => {}} />,
    )
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard denied'))
    await user.click(screen.getAllByRole('button', { name: 'Copy value' })[0])
    expect(await screen.findByText('Could not copy this value.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull()
  })
})
