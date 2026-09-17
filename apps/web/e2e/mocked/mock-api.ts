import { expect, type Page, type Request } from '@playwright/test'

export const projectId = '22222222-2222-4222-8222-222222222222'
export const entryId = '33333333-3333-4333-8333-333333333333'

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
}

export const project = {
  id: projectId,
  name: 'DevLog',
  description: 'A technical journal for software projects.',
  status: 'ACTIVE',
  createdAt: '2026-09-14T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
}

export const entry = {
  id: entryId,
  projectId,
  title: 'Understand query invalidation',
  context: 'Review how related cached collections become stale.',
  conclusion: 'Invalidate every representation affected by a mutation.',
  type: 'LEARNING',
  status: 'OPEN',
  createdAt: '2026-09-14T11:00:00.000Z',
  updatedAt: '2026-09-14T11:00:00.000Z',
}

const meta = { currentPage: 1, perPage: 10, lastPage: 1, total: 0 }

type Reply = { status?: number; body: unknown }
type Handler = (request: Request, url: URL) => Reply | undefined

/**
 * Every request is intercepted. An unmatched path fails the test rather than
 * silently reaching a developer's API or hiding a changed frontend contract.
 */
export async function mockApi(page: Page, handler: Handler) {
  const unexpected: string[] = []
  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const headers = {
      'access-control-allow-origin': 'http://localhost:4173',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'content-type',
    }

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers })
      return
    }

    const reply = handler(request, url)
    if (!reply) {
      unexpected.push(`${request.method()} ${url.pathname}${url.search}`)
    }
    await route.fulfill({
      status: reply ? (reply.status ?? 200) : 599,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(reply?.body ?? { message: 'Unexpected API request' }),
    })
  })

  return () => expect(unexpected).toEqual([])
}

export function authenticatedApi(request: Request, url: URL): Reply | undefined {
  if (request.method() !== 'GET') return undefined

  const path = url.pathname
  if (path === '/api/users/me') return { body: user }
  if (path === '/api/project') return { body: { data: [project], meta: { ...meta, total: 1 } } }
  if (path === `/api/project/${projectId}`) return { body: project }
  if (path === `/api/project/${projectId}/technical-entries`) return { body: { data: [], meta } }
  if (path === `/api/project/${projectId}/commands`) return { body: { data: [], meta } }
  if (path === `/api/project/${projectId}/resources`) return { body: { data: [], meta } }
  if (path === '/api/technical-entry') {
    const archived = url.searchParams.get('archivedAt') === 'not-null'
    return { body: { data: archived ? [] : [entry], meta: { ...meta, total: archived ? 0 : 1 } } }
  }
  if (path === `/api/technical-entry/${entryId}`) return { body: entry }
  if (path === '/api/tag') return { body: { data: [], meta } }
  return undefined
}

export function guestApi(request: Request, url: URL): Reply | undefined {
  if (request.method() === 'GET' && url.pathname === '/api/users/me') {
    return { status: 401, body: { message: 'Unauthorized' } }
  }
  return undefined
}
