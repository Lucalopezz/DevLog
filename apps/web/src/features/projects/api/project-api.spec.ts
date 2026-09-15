import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createProjectFixture } from '@/test/factories/project'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

import { archiveProject } from './archive-project'
import { createProject } from './create-project'
import { deleteProject } from './delete-project'
import { getProject } from './get-project'
import { listProjects } from './list-projects'
import { restoreProject } from './restore-project'
import { updateProject } from './update-project'

const projectId = '22222222-2222-4222-8222-222222222222'

describe('project API contracts', () => {
  it('sends project list filters as query parameters', async () => {
    const collection = {
      data: [createProjectFixture()],
      meta: { currentPage: 2, perPage: 10, lastPage: 2, total: 11 },
    }
    let capturedUrl: URL | undefined

    server.use(
      http.get(apiUrl('/project'), ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(collection)
      }),
    )

    await expect(
      listProjects({
        page: 2,
        perPage: 10,
        name: 'dev',
        status: 'ACTIVE',
        archivedAt: 'null',
        sort: 'name',
        sortDir: 'asc',
      }),
    ).resolves.toEqual(collection)
    expect(Object.fromEntries(capturedUrl?.searchParams ?? [])).toEqual({
      page: '2',
      perPage: '10',
      name: 'dev',
      status: 'ACTIVE',
      archivedAt: 'null',
      sort: 'name',
      sortDir: 'asc',
    })
    expect(capturedUrl?.searchParams.has('userId')).toBe(false)
  })

  it('posts the create payload and unwraps the project', async () => {
    const input = { name: 'DevLog', description: 'A study project' }
    const project = createProjectFixture(input)
    let capturedBody: unknown

    server.use(
      http.post(apiUrl('/project'), async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(project, { status: 201 })
      }),
    )

    await expect(createProject(input)).resolves.toEqual(project)
    expect(capturedBody).toEqual(input)
  })

  it('gets, patches, and deletes the project resource', async () => {
    const project = createProjectFixture()
    const input = { description: null, localPath: null }
    let capturedPatch: unknown
    let deleteCount = 0

    server.use(
      http.get(apiUrl(`/project/${projectId}`), () =>
        HttpResponse.json(project),
      ),
      http.patch(apiUrl(`/project/${projectId}`), async ({ request }) => {
        capturedPatch = await request.json()
        return HttpResponse.json({
          ...project,
          description: undefined,
          localPath: undefined,
        })
      }),
      http.delete(apiUrl(`/project/${projectId}`), () => {
        deleteCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(getProject(projectId)).resolves.toEqual(project)
    await expect(updateProject(projectId, input)).resolves.toMatchObject({
      id: projectId,
    })
    await expect(deleteProject(projectId)).resolves.toBeUndefined()
    expect(capturedPatch).toEqual(input)
    expect(deleteCount).toBe(1)
  })

  it('uses the archive and restore PATCH suffixes', async () => {
    const project = createProjectFixture()
    const calls: string[] = []

    server.use(
      http.patch(apiUrl(`/project/${projectId}/archive`), ({ request }) => {
        calls.push(new URL(request.url).pathname)
        return HttpResponse.json({ ...project, archivedAt: '2026-09-15T12:00:00Z' })
      }),
      http.patch(apiUrl(`/project/${projectId}/restore`), ({ request }) => {
        calls.push(new URL(request.url).pathname)
        return HttpResponse.json(project)
      }),
    )

    await archiveProject(projectId)
    await restoreProject(projectId)

    expect(calls).toEqual([
      `/api/project/${projectId}/archive`,
      `/api/project/${projectId}/restore`,
    ])
  })

  it('propagates a 409 create conflict', async () => {
    server.use(
      http.post(apiUrl('/project'), () =>
        HttpResponse.json({ message: 'Project already exists.' }, { status: 409 }),
      ),
    )

    await expect(createProject({ name: 'DevLog' })).rejects.toMatchObject({
      response: { status: 409 },
    })
  })
})
