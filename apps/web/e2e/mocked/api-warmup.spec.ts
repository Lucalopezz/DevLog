import { expect, test } from '@playwright/test'

import { authenticatedApi, guestApi, mockApi } from './mock-api'

test('warms the API on landing, login, and registration while health is pending', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, guestApi)
  let releaseHealth!: () => void
  const healthGate = new Promise<void>((resolve) => { releaseHealth = resolve })
  let healthRequestCount = 0
  let healthResponseCount = 0

  await page.route('http://localhost:3000/api/health', async (route) => {
    expect(route.request().method()).toBe('GET')
    healthRequestCount += 1
    await healthGate
    await route.fulfill({
      json: { status: 'ok' },
      headers: { 'access-control-allow-origin': 'http://localhost:4173' },
    })
    healthResponseCount += 1
  })

  try {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Keep the reasoning behind your code.' })).toBeVisible()
    await expect.poll(() => healthRequestCount).toBe(1)

    await page.getByRole('link', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    await expect.poll(() => healthRequestCount).toBe(2)

    await page.getByRole('link', { name: 'Go to the DevLog home page' }).click()
    await expect(page.getByRole('heading', { name: 'Keep the reasoning behind your code.' })).toBeVisible()
    await expect.poll(() => healthRequestCount).toBe(3)

    await page.getByRole('link', { name: 'Create account', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled()
    await expect.poll(() => healthRequestCount).toBe(4)
  } finally {
    releaseHealth()
    await expect.poll(() => healthResponseCount).toBe(healthRequestCount)
  }

  assertNoUnexpected()
})

test('a failed warmup does not prevent signing in', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  let signedIn = false
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'POST' && url.pathname === '/api/auth/login') {
      signedIn = true
      return { body: { id: '11111111-1111-4111-8111-111111111111', name: 'Ada Lovelace', email: 'ada@example.com' } }
    }

    return signedIn ? authenticatedApi(request, url) : guestApi(request, url)
  })
  await page.route('http://localhost:3000/api/health', (route) => route.abort('failed'))

  const failedHealth = page.waitForEvent('requestfailed', {
    predicate: (request) => request.url().endsWith('/api/health'),
  })
  await page.goto('/login')
  await failedHealth
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ada@example.com')
  await page.getByLabel('Password').fill('valid-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()
  expect(pageErrors).toEqual([])
  assertNoUnexpected()
})
