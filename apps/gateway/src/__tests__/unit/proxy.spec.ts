import { afterEach, describe, expect, it, vi } from 'vitest'

import { proxyRequest } from '../../proxy.js'

describe('private API proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('forwards the path, query, body, and session cookie through the private binding', async () => {
    vi.stubEnv('BACKEND_INTERNAL_URL', 'https://private-api.internal/')
    const fetchMock = vi.fn(async (request: Request) => {
      expect(request).toBeInstanceOf(Request)
      return new Response(JSON.stringify({ id: 'created' }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'devlog_access_token=token; HttpOnly; Path=/; SameSite=Lax',
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequest(
      new Request('https://preview.example/api/users?source=preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'devlog_access_token=existing',
        },
        body: JSON.stringify({ name: 'Ada' }),
      }),
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    const forwarded = fetchMock.mock.calls[0]?.[0]
    expect(forwarded.url).toBe('https://private-api.internal/api/users?source=preview')
    expect(forwarded.method).toBe('POST')
    expect(forwarded.headers.get('cookie')).toBe('devlog_access_token=existing')
    expect(await forwarded.text()).toBe(JSON.stringify({ name: 'Ada' }))
    expect(response.status).toBe(201)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(await response.json()).toEqual({ id: 'created' })
  })

  it('does not send API traffic when the private binding is missing', async () => {
    vi.stubEnv('BACKEND_INTERNAL_URL', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequest(
      new Request('https://preview.example/api/health'),
    )

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns fresh private data when the browser sends a cached validator', async () => {
    vi.stubEnv('BACKEND_INTERNAL_URL', 'https://private-api.internal/')
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.headers.has('if-none-match')) {
        return new Response(null, { status: 304, headers: { ETag: '"old"' } })
      }
      return new Response(JSON.stringify({ data: ['project'] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          ETag: '"current"',
          'Last-Modified': 'Wed, 21 Oct 2026 12:00:00 GMT',
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequest(
      new Request('https://preview.example/api/project', {
        headers: {
          Cookie: 'devlog_access_token=existing',
          'If-None-Match': '"old"',
          'If-Modified-Since': 'Wed, 21 Oct 2026 12:00:00 GMT',
        },
      }),
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0].headers.get('cookie')).toBe(
      'devlog_access_token=existing',
    )
    expect(fetchMock.mock.calls[0]?.[0].headers.has('if-none-match')).toBe(false)
    expect(fetchMock.mock.calls[0]?.[0].headers.has('if-modified-since')).toBe(false)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.has('etag')).toBe(false)
    expect(response.headers.has('last-modified')).toBe(false)
    expect(await response.json()).toEqual({ data: ['project'] })
  })
})
