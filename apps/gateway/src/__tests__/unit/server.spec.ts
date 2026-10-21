import { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'

import { createGatewayServer } from '../../server.js'

describe('gateway HTTP server', () => {
  const servers: ReturnType<typeof createGatewayServer>[] = []

  afterEach(async () => {
    await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
    servers.length = 0
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
})
