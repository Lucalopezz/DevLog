import { expect, test } from '@playwright/test'
import { authenticatedApi, mockApi, projectId } from './mock-api'

const first = {
  id: '44444444-4444-4444-8444-444444444444', projectId, projectName: 'DevLog',
  name: 'Local development', category: 'LOCAL', operatingSystem: 'Ubuntu 24.04',
  runtime: 'Node.js', runtimeVersion: '22', description: null,
  createdAt: '2026-09-25T18:00:00.000Z', updatedAt: '2026-09-25T18:00:00.000Z',
}
const meta = (count: number) => ({ currentPage: 1, perPage: 20, lastPage: 1, total: count })

test('searches environments, opens the project tab, creates a record, and sees it globally', async ({ page }) => {
  const records = [first]
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (url.pathname === '/api/project/environments' && request.method() === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase()
      const category = url.searchParams.get('category')
      const matching = records.filter((item) => (!search || [item.name, item.operatingSystem, item.runtime].some((value) => value?.toLowerCase().includes(search))) && (!category || item.category === category))
      return { body: { data: matching, meta: meta(matching.length) } }
    }
    if (url.pathname === `/api/project/${projectId}/environments` && request.method() === 'GET') {
      return { body: { data: records, meta: { ...meta(records.length), perPage: 6 } } }
    }
    if (url.pathname === `/api/project/${projectId}/environments` && request.method() === 'POST') {
      const input = request.postDataJSON() as Partial<typeof first>
      const created = { ...first, ...input, id: '55555555-5555-4555-8555-555555555555', projectId, projectName: 'DevLog' }
      records.push(created)
      return { status: 201, body: created }
    }
    return authenticatedApi(request, url)
  })

  await page.goto('/environments?category=LOCAL')
  await expect(page.getByRole('heading', { name: 'Local development' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search environments' }).fill('Ubuntu')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page).toHaveURL(/search=Ubuntu/)
  await page.getByRole('combobox', { name: 'Project' }).selectOption(projectId)
  await expect(page).toHaveURL(new RegExp(`projectId=${projectId}`))
  await page.getByRole('link', { name: 'Open project' }).click()
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`))
  const technologies = page.getByRole('tab', { name: 'Technologies' })
  await technologies.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Environments' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'New environment' }).click()
  const dialog = page.getByRole('dialog', { name: 'New environment' })
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Testing')
  await dialog.getByRole('combobox', { name: 'Category' }).selectOption('TESTING')
  await dialog.getByRole('button', { name: 'Create environment' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Environments' }).getByRole('heading', { name: 'Testing' })).toBeVisible()
  await page.getByRole('link', { name: 'Environments' }).click()
  await expect(page.getByRole('heading', { name: 'Testing' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('combobox', { name: 'Category' })).toBeVisible()
  assertNoUnexpected()
})
