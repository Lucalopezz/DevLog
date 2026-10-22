import { expect, test } from '@playwright/test'

test('the deployed registration form calls its own API', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('VERCEL_PREVIEW_URL is required')
  const deploymentOrigin = new URL(baseURL).origin
  const email = 'same-origin-check@example.invalid'
  const apiRequests: string[] = []

  // Readiness can start when the page mounts, before the form is submitted.
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) {
      apiRequests.push(request.url())
    }
  })

  // The health request reaches the real deployment. Intercept the write so
  // this browser regression test never creates a user in the shared database.
  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'verification-only', name: 'Verification', email }),
    })
  })

  await page.goto('/register')
  await page.getByRole('textbox', { name: 'Name' }).fill('Verification')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('TestPassword123!')
  await page.getByLabel('Confirm password').fill('TestPassword123!')

  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(apiRequests.filter((url) => new URL(url).pathname === '/api/health')).toHaveLength(1)
  expect(apiRequests.filter((url) => new URL(url).pathname === '/api/users')).toHaveLength(1)
  expect(apiRequests.every((url) => new URL(url).origin === deploymentOrigin)).toBe(true)
})
