import { expect, test } from '@playwright/test'
import { authenticatedApi, entry, entryId, mockApi, project, projectId } from './mock-api'

test('project cards expose a named link that can be opened from the keyboard', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/projects')
  const link = page.getByRole('link', { name: project.name, exact: true })
  await expect(link).toBeVisible()
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`))
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible()
  assertNoUnexpected()
})

test('journal cards expose a named link that can be opened from the keyboard', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/technical-entries')
  const link = page.getByRole('link', { name: entry.title, exact: true })
  await expect(link).toBeVisible()
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/technical-entries/${entryId}$`))
  await expect(page.getByRole('heading', { name: entry.title, exact: true })).toBeVisible()
  assertNoUnexpected()
})

test('linked entry cards expose the same named navigation inside a project', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}/technical-entries`) {
      return { body: { data: [entry], meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 1 } } }
    }
    return authenticatedApi(request, url)
  })
  await page.goto(`/projects/${projectId}`)
  await page.getByRole('tab', { name: 'Technical entries', exact: true }).click()
  const link = page.getByRole('link', { name: entry.title, exact: true })
  await expect(link).toBeVisible()
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/technical-entries/${entryId}$`))
  assertNoUnexpected()
})
