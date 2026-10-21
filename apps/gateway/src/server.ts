import { createServer } from 'node:http'

import { proxyRequest } from './proxy.js'

export function createGatewayServer(handler = proxyRequest) {
  return createServer(async (incoming, outgoing) => {
    try {
      const host = incoming.headers.host ?? 'localhost'
      const url = new URL(incoming.url ?? '/', `http://${host}`)
      const headers = new Headers()
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(name, item))
        else if (value !== undefined) headers.set(name, value)
      }

      const chunks: Buffer[] = []
      if (!['GET', 'HEAD'].includes(incoming.method ?? 'GET')) {
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
      }
      const request = new Request(url, {
        method: incoming.method,
        headers,
        body: chunks.length ? new Uint8Array(Buffer.concat(chunks)) : undefined,
      })
      const response = await handler(request)

      outgoing.statusCode = response.status
      response.headers.forEach((value, name) => {
        if (name !== 'set-cookie') outgoing.setHeader(name, value)
      })
      const cookies = response.headers.getSetCookie()
      if (cookies.length) outgoing.setHeader('set-cookie', cookies)
      outgoing.end(response.body ? Buffer.from(await response.arrayBuffer()) : undefined)
    } catch {
      outgoing.writeHead(502, { 'Content-Type': 'application/json' })
      outgoing.end(JSON.stringify({ message: 'API service unavailable.' }))
    }
  })
}
