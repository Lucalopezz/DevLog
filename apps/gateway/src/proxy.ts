export async function proxyRequest(request: Request): Promise<Response> {
  const binding = process.env.BACKEND_INTERNAL_URL
  if (!binding) {
    return Response.json({ message: 'API service unavailable.' }, { status: 503 })
  }

  const incomingUrl = new URL(request.url)
  if (!incomingUrl.pathname.startsWith('/api/')) {
    return Response.json({ message: 'Not found.' }, { status: 404 })
  }

  const target = new URL(incomingUrl.pathname + incomingUrl.search, binding)
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')

  try {
    // Keep the public path and session cookie intact. Only the gateway has a
    // binding, so Nest never needs a public hostname or a browser CORS grant.
    const upstream = await fetch(new Request(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
    }))
    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    })
  } catch {
    return Response.json({ message: 'API service unavailable.' }, { status: 502 })
  }
}
