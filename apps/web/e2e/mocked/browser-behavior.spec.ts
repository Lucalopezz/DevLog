import { expect, test } from '@playwright/test'
import { authenticatedApi, entry, entryId, guestApi, mockApi, project, projectId } from './mock-api'

test('mobile drawer exposes working links and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('Ada Lovelace')).toBeVisible()
  await expect(drawer.getByRole('button', { name: /Quick Capture/ })).toBeEnabled()

  await drawer.getByRole('link', { name: 'Projects' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(drawer).toBeHidden()

  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  assertNoUnexpected()
})

test('dashboard stays available when the viewport changes to mobile', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })

  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Workspace summary' })).toBeVisible()
  assertNoUnexpected()
})

test('desktop sidebar collapses and identifies active entry scope', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/technical-entries/archived')
  const archived = page.getByRole('link', { name: 'Archived Entries' })
  const active = page.getByRole('link', { name: 'All Entries', exact: true })
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

test('keyboard submit reports login errors and the built app renders the dashboard without Devtools', async ({ page }) => {
  const assertNoUnexpected = await mockApi(page, guestApi)
  await page.goto('/login')
  const email = page.getByRole('textbox', { name: 'E-mail' })
  await email.focus()
  await page.keyboard.press('Enter')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  assertNoUnexpected()

  const authenticated = await mockApi(page, authenticatedApi)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome back, Ada.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent journal entries' })).toBeVisible()
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

test('entry Markdown has a roomy scrollable reading and editing area', async ({ page }) => {
  const longText = Array.from({ length: 80 }, (_, index) => `Paragraph ${index + 1}: a technical detail.`).join('\n\n')
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (request.method() === 'GET' && url.pathname === `/api/technical-entry/${entryId}`) {
      return { body: { ...entry, context: longText, conclusion: longText } }
    }
    return authenticatedApi(request, url)
  })
  await page.goto(`/technical-entries/${entryId}`)

  for (const label of ['Context', 'Conclusion']) {
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: label, exact: true }) }).first()
    const readingArea = section.locator('div.overflow-y-auto').filter({ hasText: 'Paragraph 80' }).first()
    await expect(readingArea).toBeVisible()
    const readSize = await readingArea.evaluate((element) => ({ height: element.clientHeight, scrollHeight: element.scrollHeight }))
    expect(readSize.height).toBeGreaterThan(500)
    expect(readSize.scrollHeight).toBeGreaterThan(readSize.height)
    expect(await readingArea.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      return element.scrollTop
    })).toBeGreaterThan(0)

    await section.getByRole('button', { name: `Edit ${label.toLowerCase()}` }).click()
    const editor = section.getByRole('textbox', { name: label })
    await expect(editor).toHaveValue(longText)
    const editSize = await editor.evaluate((element) => ({ height: element.clientHeight, scrollHeight: element.scrollHeight }))
    expect(editSize.height).toBeGreaterThan(500)
    expect(editSize.scrollHeight).toBeGreaterThan(editSize.height)
    expect(await editor.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      return element.scrollTop
    })).toBeGreaterThan(0)
    await section.getByRole('button', { name: 'Cancel' }).click()
  }
  assertNoUnexpected()
})

test('entry form gives both long-form fields room and stays reachable on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  const assertNoUnexpected = await mockApi(page, authenticatedApi)
  await page.goto('/technical-entries')
  await page.getByRole('button', { name: 'New entry' }).click()
  const dialog = page.getByRole('dialog', { name: 'New technical entry' })

  for (const label of ['Context', 'Conclusion']) {
    const field = dialog.getByRole('textbox', { name: label })
    expect(await field.evaluate((element) => element.clientHeight)).toBeGreaterThan(150)
  }
  const size = await dialog.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }))
  expect(size.height).toBeLessThanOrEqual(700)
  expect(size.scrollHeight).toBeGreaterThan(size.clientHeight)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
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
