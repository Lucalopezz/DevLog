import { expect, test } from '@playwright/test'

import { authenticatedApi, guestApi, mockApi } from './mock-api'

test('shares one global warmup across landing, login, and registration', async ({
  page,
}) => {
  const assertNoUnexpected = await mockApi(page, guestApi)
  let releaseHealth!: () => void
  const healthGate = new Promise<void>((resolve) => {
    releaseHealth = resolve
  })
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
    await expect(
      page.getByRole('heading', {
        name: 'Keep the reasoning behind your code.',
      }),
    ).toBeVisible()
    await expect.poll(() => healthRequestCount).toBe(1)

    await page.getByRole('link', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    await expect.poll(() => healthRequestCount).toBe(1)

    await page.getByRole('link', { name: 'Go to the DevLog home page' }).click()
    await expect(
      page.getByRole('heading', {
        name: 'Keep the reasoning behind your code.',
      }),
    ).toBeVisible()
    await expect.poll(() => healthRequestCount).toBe(1)

    await page
      .getByRole('link', { name: 'Create account', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Create account' }),
    ).toBeEnabled()
    await expect.poll(() => healthRequestCount).toBe(1)
  } finally {
    releaseHealth()
    await expect.poll(() => healthResponseCount).toBe(healthRequestCount)
  }

  assertNoUnexpected()
})

test('waits for availability before signing in and never replays a write', async ({
  page,
}) => {
  let signedIn = false
  let loginCount = 0
  let healthy = false
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'POST' && url.pathname === '/api/auth/login') {
      loginCount += 1
      signedIn = true
      return {
        body: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
        },
      }
    }
    return signedIn ? authenticatedApi(request, url) : guestApi(request, url)
  })
  await page.route('http://localhost:3000/api/health', async (route) => {
    await route.fulfill({
      status: healthy ? 200 : 503,
      json: healthy ? { status: 'ok' } : { message: 'Unavailable' },
      headers: { 'access-control-allow-origin': 'http://localhost:4173' },
    })
  })

  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ada@example.com')
  await page.getByLabel('Password').fill('valid-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(
    page.getByRole('button', { name: 'Signing in...' }),
  ).toBeDisabled()
  await expect(page.getByText('Waiting for the server…')).toBeVisible()
  await expect(page.getByText('Could not connect. Try again.')).toBeVisible({
    timeout: 10_000,
  })
  expect(loginCount).toBe(0)
  await expect(page.getByLabel('Password')).toHaveValue('valid-password')

  healthy = true
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Ada.' }),
  ).toBeVisible()
  expect(loginCount).toBe(1)
  assertNoUnexpected()
})

test('recovers a direct private visit after a temporary failure without signing out', async ({
  page,
}) => {
  let available = false
  let sessionReads = 0
  let releaseHealth!: () => void
  const gate = new Promise<void>((resolve) => {
    releaseHealth = resolve
  })
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (url.pathname === '/api/users/me') {
      sessionReads += 1
      if (!available)
        return { status: 503, body: { message: 'Internal service details' } }
    }
    return authenticatedApi(request, url)
  })
  await page.route('http://localhost:3000/api/health', async (route) => {
    await gate
    await route.fulfill({
      json: { status: 'ok' },
      headers: { 'access-control-allow-origin': 'http://localhost:4173' },
    })
  })

  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Could not load this page' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Internal service details')).toHaveCount(0)
  available = true
  releaseHealth()
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Ada.' }),
  ).toBeVisible()
  expect(sessionReads).toBeGreaterThanOrEqual(2)
  assertNoUnexpected()
})

test('preserves a visible account across internet loss and reconnection', async ({
  page,
  context,
}) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/account')
  await expect(
    page.getByRole('heading', { name: 'User account' }),
  ).toBeVisible()
  await context.setOffline(true)
  await expect(
    page.getByText('You are offline. Check your internet connection.'),
  ).toBeVisible()
  await expect(
    page.getByText('Ada Lovelace', { exact: true }).first(),
  ).toBeVisible()
  await context.setOffline(false)
  await expect(
    page.getByText('You are offline. Check your internet connection.'),
  ).toHaveCount(0)
  await expect(page).toHaveURL(/\/account$/)
  assertNoUnexpected()
})

test('returns to sign in only after a stale session is rejected with 401', async ({
  page,
}) => {
  let expired = false
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (expired && url.pathname === '/api/users/me')
      return { status: 401, body: { message: 'Unauthorized' } }
    return authenticatedApi(request, url)
  })
  await page.clock.install()
  await page.goto('/account')
  await expect(
    page.getByRole('heading', { name: 'User account' }),
  ).toBeVisible()
  expired = true
  await page.clock.runFor(5 * 60_000)
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeVisible()
  assertNoUnexpected()
})
