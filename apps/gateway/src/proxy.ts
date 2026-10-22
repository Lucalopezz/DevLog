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
  // Nest emits ETags by default. A browser can then revalidate an authenticated
  // collection and receive 304 without the JSON body that Axios expects.
  headers.delete('if-none-match')
  headers.delete('if-modified-since')

  try {
    // Keep the public path and session cookie intact. Only the gateway has a
    // binding, so Nest never needs a public hostname or a browser CORS grant.
    const upstream = await fetch(new Request(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
    }))
    const responseHeaders = new Headers(upstream.headers)
    // API responses depend on the session cookie. Prevent browser and edge
    // caches from reusing one response or issuing another conditional request.
    responseHeaders.set('cache-control', 'private, no-store')
    responseHeaders.delete('etag')
    responseHeaders.delete('last-modified')
    // Node fetch exposes a decompressed body while retaining the upstream
    // compression headers. Forwarding them makes the browser decode plain JSON
    // as gzip and can also advertise the compressed byte length incorrectly.
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch {
    return Response.json({ message: 'API service unavailable.' }, { status: 502 })
  }
}
