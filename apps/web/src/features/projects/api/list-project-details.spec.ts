import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createTechnicalEntry } from '@/test/factories/technical-entry'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

import {
  listProjectCommands,
  listProjectResources,
  listProjectTechnicalEntries,
} from './list-project-details'

const projectId = '22222222-2222-4222-8222-222222222222'
const emptyCollection = {
  data: [],
  meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 },
}

describe('project detail collection contracts', () => {
  it('requests only active entries with the collection defaults', async () => {
    const response = {
      ...emptyCollection,
      data: [createTechnicalEntry()],
      meta: { ...emptyCollection.meta, total: 1 },
    }
    let capturedUrl: URL | undefined

    server.use(
      http.get(
        apiUrl(`/project/${projectId}/technical-entries`),
        ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json(response)
        },
      ),
    )

    await expect(listProjectTechnicalEntries(projectId)).resolves.toEqual(response)
    expect(capturedUrl?.searchParams.get('archivedAt')).toBe('null')
    expect(capturedUrl?.searchParams.get('page')).toBe('1')
    expect(capturedUrl?.searchParams.get('perPage')).toBe('6')
    expect(capturedUrl?.searchParams.has('userId')).toBe(false)
  })

  it('lets a custom page override defaults while preserving active entries', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(
        apiUrl(`/project/${projectId}/technical-entries`),
        ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json(emptyCollection)
        },
      ),
    )

    await listProjectTechnicalEntries(projectId, { page: 3, perPage: 12 })

    expect(capturedUrl?.searchParams.get('page')).toBe('3')
    expect(capturedUrl?.searchParams.get('perPage')).toBe('12')
    expect(capturedUrl?.searchParams.get('archivedAt')).toBe('null')
  })

  it('requests commands and resources with their defaults', async () => {
    const urls: URL[] = []
    server.use(
      http.get(apiUrl(`/project/${projectId}/commands`), ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(emptyCollection)
      }),
      http.get(apiUrl(`/project/${projectId}/resources`), ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(emptyCollection)
      }),
    )

    await expect(listProjectCommands(projectId)).resolves.toEqual(emptyCollection)
    await expect(listProjectResources(projectId)).resolves.toEqual(emptyCollection)
    expect(urls.map((url) => url.pathname)).toEqual([
      `/api/project/${projectId}/commands`,
      `/api/project/${projectId}/resources`,
    ])
    for (const url of urls) {
      expect(url.searchParams.get('page')).toBe('1')
      expect(url.searchParams.get('perPage')).toBe('6')
    }
  })

  it('propagates a 500 collection failure', async () => {
    server.use(
      http.get(apiUrl(`/project/${projectId}/commands`), () =>
        HttpResponse.json({ message: 'Unexpected error.' }, { status: 500 }),
      ),
    )

    await expect(listProjectCommands(projectId)).rejects.toMatchObject({
      response: { status: 500 },
    })
  })
})
