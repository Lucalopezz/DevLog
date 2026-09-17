import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { server } from './mocks/server'
import { createMatchMediaController } from './match-media'
import { disposeTestQueryClients } from './query-client'
import { disposeTestRouters } from './router-registry'

const unexpectedRequests: string[] = []

beforeAll(() => {
  server.listen({
    onUnhandledRequest(request, print) {
      unexpectedRequests.push(`${request.method} ${request.url}`)
      print.error()
    },
  })
})

beforeEach(() => {
  unexpectedRequests.length = 0

  // RootLayout and hook tests share one stable media-query object per query.
  vi.stubGlobal('matchMedia', createMatchMediaController().matchMedia)
})

afterEach(async () => {
  toast.dismiss()
  // Unmount first so active observers cannot start another refetch while the
  // shared test resources are being disposed.
  cleanup()
  disposeTestRouters()
  await disposeTestQueryClients()
  server.resetHandlers()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()

  // Axios can turn an MSW interception failure into a rejected promise. The
  // explicit check keeps a test from accidentally treating that as expected.
  if (unexpectedRequests.length > 0) {
    throw new Error(
      `Unhandled HTTP requests:\n${unexpectedRequests.join('\n')}`,
    )
  }
})

afterAll(() => server.close())
