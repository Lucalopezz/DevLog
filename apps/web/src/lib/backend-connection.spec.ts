import { afterEach, describe, expect, it, vi } from 'vitest'

import { deferred } from '@/test/deferred'

import {
  BackendConnection,
  CONNECTION_INTERVAL,
  HEALTH_TIMEOUT,
} from './backend-connection'

const connections: BackendConnection[] = []
function createConnection(
  probe = vi
    .fn<(signal: AbortSignal) => Promise<void>>()
    .mockResolvedValue(undefined),
) {
  const connection = new BackendConnection(probe)
  connections.push(connection)
  return { connection, probe }
}

afterEach(() => {
  connections.forEach((connection) => connection.stop())
  connections.length = 0
  vi.restoreAllMocks()
})

describe('backend connection supervision', () => {
  it('shares a pending round across checks and form readiness', async () => {
    const gate = deferred<void>()
    const { connection, probe } = createConnection(vi.fn(() => gate.promise))
    const first = connection.check()
    const second = connection.check(true)
    const form = connection.ensureReady()
    expect(first).toBe(second)
    expect(probe).toHaveBeenCalledTimes(1)
    gate.resolve(undefined)
    await expect(form).resolves.toBe(true)
    expect(connection.getSnapshot().status).toBe('ready')
  })

  it('reveals waiting only after 1.5 seconds and clears it after success', async () => {
    vi.useFakeTimers()
    const gate = deferred<void>()
    const { connection } = createConnection(vi.fn(() => gate.promise))
    const round = connection.check()
    await vi.advanceTimersByTimeAsync(1_499)
    expect(connection.getSnapshot().showWaiting).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(connection.getSnapshot().showWaiting).toBe(true)
    gate.resolve(undefined)
    await round
    expect(connection.getSnapshot().showWaiting).toBe(false)
  })

  it('limits each round to three attempts separated by two and five seconds', async () => {
    vi.useFakeTimers()
    const { connection, probe } = createConnection(
      vi.fn().mockRejectedValue(new Error('Unavailable')),
    )
    const round = connection.check()
    await vi.advanceTimersByTimeAsync(1_999)
    expect(probe).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(probe).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(5_000)
    await expect(round).resolves.toBe(false)
    expect(probe).toHaveBeenCalledTimes(3)
    expect(connection.getSnapshot().status).toBe('unavailable')
    await connection.check()
    expect(probe).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(3_000)
    const retry = connection.check()
    await vi.advanceTimersByTimeAsync(7_000)
    await retry
    expect(probe).toHaveBeenCalledTimes(6)
  })

  it('aborts each slow probe at 22 seconds and eventually reports unavailable', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const { connection } = createConnection(
      vi.fn(
        (signal: AbortSignal) =>
          new Promise<void>((_resolve, reject) => {
            signals.push(signal)
            signal.addEventListener(
              'abort',
              () => reject(new Error('Aborted')),
              { once: true },
            )
          }),
      ),
    )
    const round = connection.check()
    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT * 3 + 7_000)
    await expect(round).resolves.toBe(false)
    expect(signals).toHaveLength(3)
    expect(signals.every((signal) => signal.aborted)).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('pings every five minutes while visible and stops scheduling while hidden', async () => {
    vi.useFakeTimers()
    const { connection, probe } = createConnection()
    connection.start()
    await connection.ensureReady()
    await vi.advanceTimersByTimeAsync(CONNECTION_INTERVAL)
    expect(probe).toHaveBeenCalledTimes(2)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(CONNECTION_INTERVAL * 4)
    expect(probe).toHaveBeenCalledTimes(2)
  })

  it.each(['focus', 'pageshow', 'online'])(
    'checks a stale connection on %s',
    async (event) => {
      vi.useFakeTimers()
      const { connection, probe } = createConnection()
      connection.start()
      await connection.ensureReady()
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(CONNECTION_INTERVAL)
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
      window.dispatchEvent(new Event(event))
      await connection.ensureReady()
      expect(probe).toHaveBeenCalledTimes(2)
    },
  )

  it('rechecks after returning to a visible tab and deduplicates nearby events', async () => {
    vi.useFakeTimers()
    const gate = deferred<void>()
    const { connection, probe } = createConnection()
    connection.start()
    await connection.ensureReady()
    window.dispatchEvent(new Event('focus'))
    expect(probe).toHaveBeenCalledTimes(1)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(CONNECTION_INTERVAL * 4)
    probe.mockImplementation(() => gate.promise)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('pageshow'))
    expect(probe).toHaveBeenCalledTimes(2)
    gate.resolve(undefined)
    await connection.ensureReady()
  })

  it('reconnects immediately after internet loss even with a recent successful contact', async () => {
    const { connection, probe } = createConnection()
    connection.start()
    await connection.ensureReady()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))
    expect(connection.getSnapshot().status).toBe('offline')
    await expect(connection.ensureReady()).resolves.toBe(false)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    window.dispatchEvent(new Event('online'))
    await connection.ensureReady()
    expect(probe).toHaveBeenCalledTimes(2)
    expect(connection.getSnapshot().recoveryCount).toBe(1)
  })

  it('cancels probes and timers on stop and supports StrictMode mounting again', async () => {
    vi.useFakeTimers()
    const stale = deferred<void>()
    const { connection, probe } = createConnection(vi.fn(() => stale.promise))
    connection.start()
    const oldRound = connection.ensureReady()
    const signal = probe.mock.calls[0][0]
    connection.stop()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    probe.mockResolvedValue(undefined)
    connection.start()
    await expect(connection.ensureReady()).resolves.toBe(true)
    stale.resolve(undefined)
    await expect(oldRound).resolves.toBe(false)
    expect(connection.getSnapshot().status).toBe('ready')
    expect(connection.getSnapshot().recoveryCount).toBe(0)
  })

  it('uses ordinary successful API traffic to avoid unnecessary pings', async () => {
    vi.useFakeTimers()
    const { connection, probe } = createConnection()
    connection.start()
    await connection.ensureReady()
    await vi.advanceTimersByTimeAsync(CONNECTION_INTERVAL - 1_000)
    connection.recordSuccess()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(probe).toHaveBeenCalledTimes(1)
  })

  it('sends an uncached public health request without credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })))
    vi.stubGlobal('fetch', fetch)
    const connection = new BackendConnection()
    connections.push(connection)
    await expect(connection.check()).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/health'), {
      cache: 'no-store',
      credentials: 'omit',
      signal: expect.any(AbortSignal),
    })
  })

  it('rejects a successful HTML loading response from the hosting provider', async () => {
    vi.useFakeTimers()
    const fetch = vi
      .fn()
      .mockImplementation(async () => new Response('<html>Loading</html>'))
    vi.stubGlobal('fetch', fetch)
    const connection = new BackendConnection()
    connections.push(connection)
    const round = connection.check()
    await vi.advanceTimersByTimeAsync(7_000)
    await expect(round).resolves.toBe(false)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
