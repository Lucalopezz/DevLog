import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { server } from './mocks/server'
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

  // RootLayout needs matchMedia through useIsMobile. This desktop double owns
  // listeners per query so later browser-oriented tests can dispatch changes
  // without replacing the application hook.
  const listenersByMedia = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >()
  vi.stubGlobal('matchMedia', (media: string) => {
    const listeners = listenersByMedia.get(media) ?? new Set()
    listenersByMedia.set(media, listeners)

    return {
      matches: false,
      media,
      onchange: null,
      addListener: (listener: EventListenerOrEventListenerObject) =>
        listeners.add(listener),
      removeListener: (listener: EventListenerOrEventListenerObject) =>
        listeners.delete(listener),
      addEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => listeners.add(listener),
      removeEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => listeners.delete(listener),
      dispatchEvent: (event: Event) => {
        for (const listener of listeners) {
          if (typeof listener === 'function') listener(event)
          else listener.handleEvent(event)
        }
        return !event.defaultPrevented
      },
    } as MediaQueryList
  })
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
