import { expect, test } from '@playwright/test'

import { authenticatedApi, guestApi, mockApi } from './mock-api'

test('public navigation never probes API health', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, guestApi)
  const healthRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/health') healthRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Keep the reasoning behind your code.' })).toBeVisible()
  await page.getByRole('link', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  await page.getByRole('link', { name: 'Go to the DevLog home page' }).click()
  await page.getByRole('link', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled()
  expect(healthRequests).toEqual([])
  assertNoUnexpected()
})

test('signs in directly while health is unavailable and never replays a lost write', async ({ page }) => {
  let loginCount = 0
  let signedIn = false
  let loseResponse = true
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (url.pathname === '/api/health') return { status: 503, body: {} }
    return signedIn ? authenticatedApi(request, url) : guestApi(request, url)
  })
  await page.route('http://localhost:3000/api/auth/login', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fallback()
    loginCount += 1
    if (loseResponse) return route.abort('failed')
    signedIn = true
    await route.fulfill({
      json: { id: '11111111-1111-4111-8111-111111111111', name: 'Ada Lovelace', email: 'ada@example.com' },
      headers: {
        'access-control-allow-origin': 'http://localhost:4173',
        'access-control-allow-credentials': 'true',
      },
    })
  })
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ada@example.com')
  await page.getByLabel('Password').fill('valid-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Could not sign in. Check your credentials and try again.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled()
  expect(loginCount).toBe(1)
  await expect(page.getByLabel('Password')).toHaveValue('valid-password')
  loseResponse = false
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()
  expect(loginCount).toBe(2)
  assertNoUnexpected()
})

test('retries a direct private visit without a health gate or sign out', async ({ page }) => {
  let available = false
  let sessionReads = 0
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (url.pathname === '/api/health') return { status: 503, body: {} }
    if (url.pathname === '/api/users/me') {
      sessionReads += 1
      if (!available) return { status: 503, body: { message: 'Internal service details' } }
    }
    return authenticatedApi(request, url)
  })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Could not load this page' })).toBeVisible()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Internal service details')).toHaveCount(0)
  available = true
  await page.getByRole('button', { name: 'Try loading again' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()
  expect(sessionReads).toBeGreaterThanOrEqual(2)
  assertNoUnexpected()
})

test('idle time and browser events preserve the account without health polling', async ({ page, context }) => {
  let healthRequests = 0
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (url.pathname === '/api/health') healthRequests += 1
    return authenticatedApi(request, url)
  })
  await page.clock.install()
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'User account' })).toBeVisible()
  await page.clock.runFor(10 * 60_000)
  await context.setOffline(true)
  await expect(page.getByText('Ada Lovelace', { exact: true }).first()).toBeVisible()
  await context.setOffline(false)
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('pageshow'))
    window.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole('heading', { name: 'User account' })).toBeVisible()
  expect(healthRequests).toBe(0)
  await expect(page.getByRole('complementary', { name: 'Connection status' })).toHaveCount(0)
  assertNoUnexpected()
})

test('a stale profile is checked directly on return and only a 401 ends the session', async ({ page }) => {
  let expired = false
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (expired && url.pathname === '/api/users/me') return { status: 401, body: { message: 'Unauthorized' } }
    return authenticatedApi(request, url)
  })
  await page.clock.install()
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'User account' })).toBeVisible()
  expired = true
  await page.clock.runFor(31_000)
  // TanStack Query listens for tab visibility to refresh stale active reads.
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  assertNoUnexpected()
})
