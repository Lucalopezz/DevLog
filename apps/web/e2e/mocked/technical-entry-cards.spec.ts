import { expect, test } from '@playwright/test'
import { authenticatedApi, entry, entryId, mockApi } from './mock-api'

test.use({ colorScheme: 'dark' })

const longWord = 'ColdStartRecovery'.repeat(10)
const markdown = `Recover authenticated requests after the API wakes up.\n\n[Diagnostic URL](https://example.com/${longWord})\n\n\`\`\`sh\n${longWord}\n\`\`\`\n\n| Command | Details |\n| --- | --- |\n| ${longWord} | ${longWord} |`
const entries = [
  {
    ...entry,
    title: 'Recover the frontend from API cold starts without losing the authenticated session',
    context: markdown,
    conclusion: markdown,
    type: 'ISSUE',
    status: 'RESOLVED',
    tags: [{ id: 'tag-1', name: 'ColdStart'.repeat(8) }, { id: 'tag-2', name: 'Render' }],
  },
  {
    ...entry,
    id: '44444444-4444-4444-8444-444444444444',
    title: longWord,
    context: longWord,
    conclusion: longWord,
    status: undefined,
  },
]

for (const route of ['/technical-entries', '/technical-entries/archived']) {
  for (const width of [320, 390, 1440]) {
    test(`technical-entry cards fit ${route} at width ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const assertNoUnexpected = await mockApi(page, (request, url) => {
        if (request.method() === 'GET' && url.pathname === '/api/technical-entry') {
          return {
            body: {
              data: entries,
              meta: { currentPage: 1, perPage: 10, lastPage: 1, total: entries.length },
            },
          }
        }
        return authenticatedApi(request, url)
      })
      await page.goto(route)
      const cards = page.locator('article')
      await expect(cards).toHaveCount(entries.length)
      await expect(cards.first().getByText('Resolved', { exact: true })).toBeVisible()
      await expect(cards.first().getByRole('heading', { name: entries[0].title })).toBeVisible()
      await expect(cards.last().getByRole('heading', { name: longWord })).toBeVisible()
      await expect(cards.first().locator('pre')).toHaveCount(2)
      await expect(cards.first().locator('table')).toHaveCount(2)
      await page.evaluate(() => document.fonts.ready)

      // Measure the rendered layout: jsdom cannot detect Grid/Flexbox overflow.
      // Code and tables may scroll locally, but titles and tags must stay readable.
      const layout = await cards.evaluateAll((elements) => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        cards: elements.map((card) => {
          const bounds = card.getBoundingClientRect()
          const content = Array.from(card.querySelectorAll<HTMLElement>(
            'header, h3, h3 > span, header > span, article > div, article > ul > li',
          ))
          return {
            left: bounds.left,
            right: bounds.right,
            overflow: content.filter((element) => {
              const child = element.getBoundingClientRect()
              return child.left < bounds.left || child.right > bounds.right
                || element.scrollWidth > element.clientWidth + 1
            }).map((element) => element.tagName),
          }
        }),
      }))
      expect(layout.document).toBeLessThanOrEqual(layout.viewport)
      for (const card of layout.cards) {
        expect(card.left).toBeGreaterThanOrEqual(0)
        expect(card.right).toBeLessThanOrEqual(layout.viewport)
        expect(card.overflow).toEqual([])
      }
      if (width === 1440) {
        const first = await cards.first().boundingBox()
        const second = await cards.last().boundingBox()
        expect(first?.y).toBe(second?.y)
        expect(second!.x).toBeGreaterThan(first!.x)
      }
      assertNoUnexpected()

      // The whole card remains a keyboard-accessible link after wrapping.
      if (route === '/technical-entries' && width === 390) {
        await page.screenshot({ path: test.info().outputPath('mobile-cards.png'), fullPage: true })
        const link = page.locator(`a[href="/technical-entries/${entryId}"]`)
        await link.focus()
        await expect(link).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(`/technical-entries/${entryId}`)
        await expect(page.getByRole('heading', { name: entry.title, exact: true })).toBeVisible()
        assertNoUnexpected()
      }
    })
  }
}
