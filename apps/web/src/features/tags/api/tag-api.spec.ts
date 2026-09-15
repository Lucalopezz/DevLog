import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createTag as createTagFixture } from '@/test/factories/tag'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

import { createTag } from './create-tag'
import { deleteTag } from './delete-tag'
import { listTags } from './list-tags'

const tagId = '44444444-4444-4444-8444-444444444444'

describe('tag API contracts', () => {
  it('sends list filters and unwraps the collection', async () => {
    const collection = {
      data: [createTagFixture()],
      meta: { currentPage: 2, perPage: 5, lastPage: 2, total: 6 },
    }
    let capturedUrl: URL | undefined

    server.use(
      http.get(apiUrl('/tag'), ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(collection)
      }),
    )

    await expect(
      listTags({
        page: 2,
        perPage: 5,
        name: 'react',
        sort: 'name',
        sortDir: 'asc',
      }),
    ).resolves.toEqual(collection)
    expect(Object.fromEntries(capturedUrl?.searchParams ?? [])).toEqual({
      page: '2',
      perPage: '5',
      name: 'react',
      sort: 'name',
      sortDir: 'asc',
    })
  })

  it('posts the create payload and deletes by ID', async () => {
    const input = { name: 'React' }
    const tag = createTagFixture()
    let capturedBody: unknown
    let deleteCount = 0

    server.use(
      http.post(apiUrl('/tag'), async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(tag, { status: 201 })
      }),
      http.delete(apiUrl(`/tag/${tagId}`), () => {
        deleteCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(createTag(input)).resolves.toEqual(tag)
    await expect(deleteTag(tagId)).resolves.toBeUndefined()
    expect(capturedBody).toEqual(input)
    expect(deleteCount).toBe(1)
  })

  it('propagates a 500 list failure', async () => {
    server.use(
      http.get(apiUrl('/tag'), () =>
        HttpResponse.json({ message: 'Unexpected error.' }, { status: 500 }),
      ),
    )

    await expect(listTags()).rejects.toMatchObject({
      response: { status: 500 },
    })
  })
})
