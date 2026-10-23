import { expect, test } from '@playwright/test'
import { authenticatedApi, entry, entryId, mockApi, project, projectId } from './mock-api'

const diagram = '```mermaid\nflowchart LR\n  A[Start] --> B[Done]\n```'
const namedDiagram = '```mermaid\nflowchart LR\n  accTitle: Delivery flow\n  accDescr: Start leads to Done\n  A[Start] --> B[Done]\n```'
const invalidDiagram = '```mermaid\nthis is not a diagram\n```'

test('Mermaid fences render in project and journal Markdown fields', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}`) {
      return { body: { ...project, description: `${namedDiagram}\n\n\`\`\`ts\nconst answer = 42\n\`\`\`` } }
    }
    if (request.method() === 'GET' && url.pathname === `/api/technical-entry/${entryId}`) {
      return { body: { ...entry, context: diagram, conclusion: invalidDiagram } }
    }
    return authenticatedApi(request, url)
  })

  await page.goto(`/projects/${projectId}`)
  const projectDiagram = page.getByRole('img', { name: 'Delivery flow' })
  await expect(projectDiagram.locator('svg')).toBeVisible()
  await expect(projectDiagram).toHaveAttribute('aria-description', 'Start leads to Done')
  await expect(projectDiagram).toContainText('Start')
  await expect(projectDiagram).toContainText('Done')
  await expect(page.locator('pre code.language-ts')).toHaveText('const answer = 42')
  await page.getByText('View diagram source').click()
  await expect(page.locator('pre code.language-mermaid')).toContainText('flowchart LR')

  await page.goto(`/technical-entries/${entryId}`)
  const entryDiagram = page.getByRole('img', { name: 'Mermaid diagram' })
  await expect(entryDiagram.locator('svg')).toBeVisible()
  await expect(page.getByText('Diagram could not be rendered')).toBeVisible()
  await expect(page.locator('pre code.language-mermaid').filter({ hasText: 'this is not a diagram' })).toBeVisible()

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }))
    expect(layout.document, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport)
  }
  assertNoUnexpected()
})

test('compact project and journal cards leave Mermaid fences as code', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === '/api/project') {
      return { body: { data: [{ ...project, description: diagram }], meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 } } }
    }
    if (request.method() === 'GET' && url.pathname === '/api/technical-entry') {
      return { body: { data: [{ ...entry, context: diagram }], meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 } } }
    }
    return authenticatedApi(request, url)
  })

  await page.goto('/projects')
  await expect(page.locator('pre code.language-mermaid')).toHaveCount(1)
  await expect(page.getByRole('img', { name: 'Mermaid diagram' })).toHaveCount(0)

  await page.goto('/technical-entries')
  await expect(page.locator('pre code.language-mermaid')).toHaveCount(1)
  await expect(page.getByRole('img', { name: 'Mermaid diagram' })).toHaveCount(0)
  assertNoUnexpected()
})
