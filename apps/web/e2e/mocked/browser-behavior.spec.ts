import { expect, test } from '@playwright/test'
import { authenticatedApi, entry, entryId, guestApi, mockApi, project, projectId } from './mock-api'

test('mobile drawer exposes working links and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/')
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('Ada Lovelace')).toBeVisible()
  await expect(drawer.getByRole('button', { name: /Quick Capture/ })).toBeDisabled()

  await drawer.getByRole('link', { name: 'Projects' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(drawer).toBeHidden()

  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  assertNoUnexpected()
})

test('desktop sidebar collapses and identifies active entry scope', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/technical-entries/archived')
  const archived = page.getByRole('link', { name: 'Archived Entries' })
  const active = page.getByRole('link', { name: 'Technical Journal' })
  await expect(archived).toHaveAttribute('aria-current', 'page')
  await expect(active).not.toHaveAttribute('aria-current', 'page')

  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  await expect(page.locator('[data-slot="sidebar"][data-state]')).toHaveAttribute('data-state', 'collapsed')
  assertNoUnexpected()
})

test('project dialog traps focus and restores it after Escape', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/projects')
  const trigger = page.getByRole('button', { name: 'New project' })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Tab')
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  assertNoUnexpected()
})

test('project tabs support arrow keys, Home and End with matching panels', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto(`/projects/${projectId}`)
  const overview = page.getByRole('tab', { name: 'Overview' })
  const entries = page.getByRole('tab', { name: 'Technical entries' })
  const settings = page.getByRole('tab', { name: 'Settings' })

  await overview.focus()
  await page.keyboard.press('ArrowRight')
  await expect(entries).toBeFocused()
  await expect(entries).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Technical entries' })).toBeVisible()
  await page.keyboard.press('End')
  await expect(settings).toBeFocused()
  await expect(settings).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Home')
  await expect(overview).toBeFocused()
  await expect(overview).toHaveAttribute('aria-selected', 'true')
  assertNoUnexpected()
})

test('keyboard submit reports login errors and the built app shows a notification without Devtools', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    return url.pathname === '/api/users/me' ? guestApi(request, url) : undefined
  })
  await page.goto('/login')
  const email = page.getByRole('textbox', { name: 'E-mail' })
  await email.focus()
  await page.keyboard.press('Enter')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  assertNoUnexpected()

  const authenticated = await mockApi(page, authenticatedApi)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Frontend foundation ready' })).toBeVisible()
  await expect(page.getByText('Use React Query for API queries and mutations.')).toBeVisible()
  await page.getByRole('button', { name: 'Test notification' }).click()
  await expect(page.getByText('Sonner is configured!')).toBeVisible()
  await expect(page.locator('.tsqd-parent-container')).toHaveCount(0)
  authenticated()
})

test('long Markdown, project paths and descriptions stay usable at a narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const longWord = 'command'.repeat(40)
  const markdown = `A long technical note.\n\n\`\`\`sh\n${longWord}\n\`\`\`\n\n| Command | Description |\n| --- | --- |\n| ${longWord} | ${longWord} |`
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}`) {
      return { body: { ...project, name: longWord, localPath: `/projects/${longWord}`, description: markdown } }
    }
    if (request.method() === 'GET' && url.pathname === `/api/technical-entry/${entryId}`) {
      return { body: { ...entry, context: markdown } }
    }
    return authenticatedApi(request, url)
  })

  for (const path of [`/projects/${projectId}`, `/technical-entries/${entryId}`]) {
    await page.goto(path)
    await expect(page.locator('pre').first()).toBeVisible()
    await expect(page.locator('table').first()).toBeVisible()
    const measurements = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      code: document.querySelector('pre')?.scrollWidth ?? 0,
      codeViewport: document.querySelector('pre')?.clientWidth ?? 0,
      overflowing: Array.from(document.querySelectorAll('*'))
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 10)
        .map((element) => `${element.tagName}.${element.className}`),
    }))
    expect(measurements.document, JSON.stringify(measurements.overflowing)).toBeLessThanOrEqual(measurements.viewport)
    expect(measurements.code).toBeGreaterThan(measurements.codeViewport)
  }
  assertNoUnexpected()
})

test('a failed collection has a named error and a keyboard-reachable retry', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === '/api/project') {
      return { status: 500, body: { message: 'Unavailable' } }
    }
    return authenticatedApi(request, url)
  })
  await page.goto('/projects')
  const error = page.getByRole('alert', { name: 'Could not load projects' })
  await expect(error).toBeVisible()
  const retry = error.getByRole('button', { name: 'Try again' })
  await retry.focus()
  await expect(retry).toBeFocused()
  assertNoUnexpected()
})
