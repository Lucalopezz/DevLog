import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Markdown } from './markdown'

describe('Markdown', () => {
  it('renders standard content with semantic elements', () => {
    const { container } = render(
      <Markdown>{'# Heading\n\n- First\n- Second\n\n**Bold** and *emphasis*.\n\n`inline`\n\n```ts\nconst answer = 42\n```\n\n[Docs](https://example.com/docs)'}</Markdown>,
    )
    expect(screen.getByRole('heading', { name: 'Heading', level: 1 })).toBeVisible()
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Bold').tagName).toBe('STRONG')
    expect(screen.getByText('emphasis').tagName).toBe('EM')
    expect(screen.getByText('inline').tagName).toBe('CODE')
    expect(container.querySelector('pre code')).toHaveTextContent('const answer = 42')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://example.com/docs')
  })

  it('supports GFM tables, tasks, and strikethrough', () => {
    render(
      <Markdown>{'| Tool | Role |\n| --- | --- |\n| Vitest | Unit tests |\n\n- [x] Covered\n- [ ] Pending\n\n~~Outdated~~'}</Markdown>,
    )
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Tool' })).toBeVisible()
    expect(within(table).getByRole('cell', { name: 'Unit tests' })).toBeVisible()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    expect(screen.getByText('Outdated').tagName).toBe('DEL')
  })

  it('does not execute raw HTML or turn unsafe schemes into links', () => {
    const { container } = render(
      <Markdown>{'<img src=x onerror="alert(1)">\n\n[Unsafe](javascript:alert(1))'}</Markdown>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Unsafe' })).toBeNull()
    expect(screen.getByText('Unsafe')).toBeVisible()
  })
})
