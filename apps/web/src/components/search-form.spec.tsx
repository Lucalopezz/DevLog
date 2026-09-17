import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ProjectFilters } from '@/features/projects/components/project-filter'

describe('SearchForm through ProjectFilters', () => {
  it('submits with Enter and clears both the draft and applied filters', async () => {
    const onSearch = vi.fn()
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(
      <ProjectFilters
        initialName="Initial"
        initialStatus="ACTIVE"
        onClear={onClear}
        onSearch={onSearch}
      />,
    )
    const form = screen.getByRole('form', { name: 'Search filters' })
    expect(form).toBeVisible()
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Updated{Enter}')
    expect(onSearch).toHaveBeenCalledWith({ name: 'Updated', status: 'ACTIVE' })
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onClear).toHaveBeenCalledOnce()
    expect(name).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('')
  })
})
