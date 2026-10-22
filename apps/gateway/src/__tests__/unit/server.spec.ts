import { createServer } from 'node:http'
import { AddressInfo } from 'node:net'
import { gzipSync } from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGatewayServer } from '../../server.js'

describe('gateway HTTP server', () => {
  const servers: ReturnType<typeof createGatewayServer>[] = []

  afterEach(async () => {
    await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
    servers.length = 0
    vi.unstubAllEnvs()
  })

  it('preserves request data and Set-Cookie across the HTTP boundary', async () => {
    let received: Request | undefined
    const server = createGatewayServer(async (request) => {
      received = request
      return new Response('created', {
        status: 201,
        headers: { 'Set-Cookie': 'devlog_access_token=token; HttpOnly; Path=/' },
      })
    })
    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as AddressInfo).port

    const response = await fetch(`http://127.0.0.1:${port}/api/users?source=test`, {
      method: 'POST',
      headers: { Cookie: 'devlog_access_token=old' },
      body: 'example',
    })

    expect(received?.url).toBe(`http://127.0.0.1:${port}/api/users?source=test`)
    expect(received?.headers.get('cookie')).toBe('devlog_access_token=old')
    expect(await received?.text()).toBe('example')
    expect(response.status).toBe(201)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(await response.text()).toBe('created')
  })

  it('returns readable JSON when the private API compresses its response', async () => {
    const body = JSON.stringify({ data: ['project'] })
    const compressed = gzipSync(body)
    const upstream = createServer((_request, response) => {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Content-Length': compressed.length,
      })
      response.end(compressed)
    })
    servers.push(upstream)
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve))
    vi.stubEnv('BACKEND_INTERNAL_URL', `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`)

    const gateway = createGatewayServer()
    servers.push(gateway)
    await new Promise<void>((resolve) => gateway.listen(0, '127.0.0.1', resolve))
    const port = (gateway.address() as AddressInfo).port

    const response = await fetch(`http://127.0.0.1:${port}/api/project`, {
      headers: { 'Accept-Encoding': 'gzip' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: ['project'] })
    expect(response.headers.get('content-encoding')).toBeNull()
    expect(response.headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
  })
})
