import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

import { ProjectPagination } from './project-list-pagination'

const baseMeta = {
  currentPage: 2,
  perPage: 10,
  lastPage: 3,
  total: 12345,
}

describe('ProjectPagination', () => {
  it('formats metadata in en-US and requests adjacent pages', async () => {
    const onPageChange = vi.fn()
    const { user } = renderWithProviders(
      <ProjectPagination
        isFetching={false}
        meta={baseMeta}
        onPageChange={onPageChange}
      />,
    )

    expect(screen.getByText('Page 2 of 3 · 12,345 project(s)')).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Go to the previous page' }),
    )
    await user.click(screen.getByRole('button', { name: 'Go to the next page' }))
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3)
  })

  it.each([
    [1, 3, true, false],
    [3, 3, false, true],
    [1, 1, true, true],
  ])(
    'sets boundaries for page %i of %i',
    (currentPage, lastPage, previousDisabled, nextDisabled) => {
      renderWithProviders(
        <ProjectPagination
          isFetching={false}
          meta={{ ...baseMeta, currentPage, lastPage }}
          onPageChange={vi.fn()}
        />,
      )

      expect(
        screen.getByRole('button', { name: 'Go to the previous page' }),
      ).toHaveProperty('disabled', previousDisabled)
      expect(
        screen.getByRole('button', { name: 'Go to the next page' }),
      ).toHaveProperty('disabled', nextDisabled)
    },
  )

  it('disables both controls during a background fetch', () => {
    renderWithProviders(
      <ProjectPagination
        isFetching
        meta={baseMeta}
        onPageChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Go to the previous page' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Go to the next page' }),
    ).toBeDisabled()
  })
})
