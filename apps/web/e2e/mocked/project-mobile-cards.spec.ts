import { expect, test, type Locator, type Page } from '@playwright/test'
import { authenticatedApi, entry, mockApi, project, projectId } from './mock-api'

const longWord = 'MobileLayoutWithoutSpaces'.repeat(12)

async function expectCardFitsViewport(page: Page, card: Locator) {
  await page.evaluate(() => document.fonts.ready)
  const layout = await card.evaluate((element) => {
    const viewport = document.documentElement.clientWidth
    const cardBounds = element.getBoundingClientRect()
    const title = element.querySelector('h3')
    const titleBounds = title?.getBoundingClientRect()
    return {
      viewport,
      document: document.documentElement.scrollWidth,
      cardLeft: cardBounds.left,
      cardRight: cardBounds.right,
      titleRight: titleBounds?.right,
      titleScrollWidth: title?.scrollWidth,
      titleClientWidth: title?.clientWidth,
    }
  })

  // Measure real layout: an implicit grid track may grow to a long word's
  // min-content width even though the card appears on a single mobile column.
  expect(layout.document, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport)
  expect(layout.cardLeft, JSON.stringify(layout)).toBeGreaterThanOrEqual(0)
  expect(layout.cardRight, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport)
  expect(layout.titleRight, JSON.stringify(layout)).toBeLessThanOrEqual(layout.cardRight)
  expect(layout.titleScrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.titleClientWidth! + 1)
}

for (const width of [320, 390]) {
  test(`project list card fits a ${width}px viewport with long content`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const assertNoUnexpected = await mockApi(page, (request, url) => {
      if (request.method() === 'GET' && url.pathname === '/api/project') {
        return {
          body: {
            data: [{ ...project, name: longWord, description: longWord }],
            meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
          },
        }
      }
      return authenticatedApi(request, url)
    })

    await page.goto('/projects')
    const card = page.locator('section[aria-labelledby="projects-list-title"] article')
    await expect(card.getByRole('heading', { name: longWord })).toBeVisible()
    await expectCardFitsViewport(page, card)
    assertNoUnexpected()
  })

  test(`project's linked entry card fits a ${width}px viewport with long content`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const assertNoUnexpected = await mockApi(page, (request, url) => {
      if (request.method() === 'GET' && url.pathname === `/api/project/${projectId}/technical-entries`) {
        return {
          body: {
            data: [{ ...entry, title: longWord, context: longWord, tags: [{ id: 'tag-1', name: longWord }] }],
            meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 1 },
          },
        }
      }
      return authenticatedApi(request, url)
    })

    await page.goto(`/projects/${projectId}`)
    await page.getByRole('tab', { name: 'Technical entries', exact: true }).click()
    const card = page.getByRole('tabpanel', { name: 'Technical entries' }).locator('article')
    await expect(card.getByRole('heading', { name: longWord })).toBeVisible()
    await expectCardFitsViewport(page, card)
    assertNoUnexpected()
  })
}
