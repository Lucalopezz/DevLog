import { expect, test } from '@playwright/test'
import { authenticatedApi, entryId, guestApi, mockApi, projectId } from './mock-api'

test('a guest can reload public routes and a protected deep link redirects', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, guestApi)

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Keep the reasoning behind your code.' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Keep the reasoning behind your code.' }),
  ).toBeVisible()

  for (const path of ['/login', '/register']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await page.reload()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
  }

  await page.goto(`/projects/${projectId}`)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
  assertNoUnexpected()
})

test('an authenticated user can open and reload every protected route', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  const routes = [
    ['/dashboard', 'Welcome back, Ada.'],
    ['/account', 'User account'],
    ['/projects', 'Projects'],
    [`/projects/${projectId}`, 'DevLog'],
    ['/technical-entries', 'Technical journal'],
    [`/technical-entries/${entryId}`, 'Understand query invalidation'],
    ['/technical-entries/archived', 'Archived technical entries'],
    ['/tags', 'Tags'],
  ] as const

  for (const [path, heading] of routes) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible()
  }

  await page.goto('/login')
  await expect(page).toHaveURL(/\/dashboard$/)
  assertNoUnexpected()
})

test('browser history restores applied project filters', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/projects?name=Alpha')
  const name = page.getByRole('textbox', { name: 'Name' })
  await expect(name).toHaveValue('Alpha')
  await name.fill('Beta')
  await name.press('Enter')
  await expect(page).toHaveURL(/name=Beta/)

  await page.goBack()
  await expect(name).toHaveValue('Alpha')
  await page.goForward()
  await expect(name).toHaveValue('Beta')
  assertNoUnexpected()
})
