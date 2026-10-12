import { expect, test } from '@playwright/test'
import { authenticatedApi, mockApi, project, projectId } from './mock-api'

const repositories = [
  {
    id: 'repository-1',
    projectId,
    label: 'Project repository',
    url: 'https://github.com/example/devlog',
    type: 'REPOSITORY',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  },
  {
    id: 'repository-2',
    projectId,
    label: 'Background worker with a long repository name',
    url: `https://gitlab.com/example/${'background-worker-'.repeat(8)}`,
    type: 'REPOSITORY',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  },
]

for (const theme of ['light', 'dark']) {
  test(`Overview repositories remain accessible on desktop and mobile in ${theme} mode`, async ({ page, context }, testInfo) => {
    const assertNoUnexpected = await mockApi(page, (request, url) => {
      if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}`) {
        return { body: { ...project, technologies: [{ id: 'technology-1', name: 'React', version: '19' }] } }
      }
      if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}/resources`) {
        return {
          body: {
            data: repositories,
            meta: { currentPage: 1, perPage: 100, lastPage: 1, total: repositories.length },
          },
        }
      }
      return authenticatedApi(request, url)
    })
    // The destination is intercepted too, so keyboard navigation cannot send
    // requests to a real repository service during this browser test.
    await context.route(repositories[0].url, (route) => route.fulfill({
      contentType: 'text/html',
      body: '<title>Project source</title><h1>Project source</h1>',
    }))
    await page.goto(`/projects/${projectId}`)
    await page.evaluate((isDark) => document.documentElement.classList.toggle('dark', isDark), theme === 'dark')
    const card = page.getByRole('region', { name: 'Repositories' })
    const firstLink = card.getByRole('link', { name: 'Project repository (opens in a new tab)' })
    await expect(firstLink).toBeVisible()
    const technologies = page.getByRole('heading', { name: 'Technologies', exact: true })
    const about = page.getByRole('heading', { name: 'About the project' })
    const technologyBox = await technologies.boundingBox()
    const repositoryBox = await card.boundingBox()
    const aboutBox = await about.boundingBox()
    expect(repositoryBox!.y).toBeGreaterThan(technologyBox!.y + technologyBox!.height)
    expect(repositoryBox!.x).toBeGreaterThan(aboutBox!.x)
    await page.screenshot({ path: testInfo.outputPath(`${theme}-desktop.png`), fullPage: true })

    await firstLink.focus()
    const popupPromise = page.waitForEvent('popup')
    await page.keyboard.press('Enter')
    const popup = await popupPromise
    await expect(popup).toHaveURL(repositories[0].url)
    await expect(popup.getByRole('heading', { name: 'Project source' })).toBeVisible()
    await popup.close()

    await page.getByRole('tab', { name: 'Resources', exact: true }).click()
    await expect(card).toHaveCount(0)
    await page.getByRole('tab', { name: 'Overview' }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(firstLink).toBeVisible()
    await expect(card.getByRole('link', { name: `${repositories[1].label} (opens in a new tab)` })).toBeVisible()
    const width = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(width.document).toBeLessThanOrEqual(width.viewport)
    await page.screenshot({ path: testInfo.outputPath(`${theme}-mobile.png`), fullPage: true })
    assertNoUnexpected()
  })
}
