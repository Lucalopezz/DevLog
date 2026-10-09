import { API_URL } from '@/api/api-url'

export const CONNECTION_INTERVAL = 5 * 60_000
export const HEALTH_TIMEOUT = 22_000
// Browser events can arrive together; this cooldown limits automatic rounds,
// while explicit user retries can bypass it. It does not delay attempts inside a round.
const AUTOMATIC_COOLDOWN = 10_000
const WAITING_DELAY = 1_500
const RETRY_DELAYS = [2_000, 5_000]

export interface ConnectionSnapshot {
  status: 'idle' | 'checking' | 'ready' | 'unavailable' | 'offline'
  showWaiting: boolean
  recoveryCount: number
}

type HealthProbe = (signal: AbortSignal) => Promise<void>

async function probeHealth(signal: AbortSignal) {
  // Vite serves a static app: the public health request goes straight to Nest.
  // Omit cookies explicitly; this request must neither depend on nor renew auth.
  const response = await fetch(`${API_URL}/health`, {
    cache: 'no-store',
    credentials: 'omit',
    signal,
  })
  if (!response.ok) throw new Error('Health request failed.')
  // Render can return its own HTML loading page. Only Nest's response proves
  // the application is listening; a successful HTTP status alone is insufficient.
  const body: unknown = await response.json()
  if (
    !body ||
    typeof body !== 'object' ||
    !('status' in body) ||
    body.status !== 'ok'
  ) {
    throw new Error('Unexpected health response.')
  }
}

function pause(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    // Cancellation must also interrupt retry delays, not just HTTP requests.
    // Resolve instead of rejecting: runRound checks the signal before continuing.
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, duration)
    signal.addEventListener('abort', finish, { once: true })
    // Abort events are not replayed to listeners registered after cancellation.
    if (signal.aborted) finish()
  })
}

/**
 * External store: browser events, forms and React all share one health round.
 * React only subscribes to snapshots; this class owns timers and cancellation.
 */
export class BackendConnection {
  // Snapshots describe UI state; mutable request/timer details stay private.
  // recoveryCount identifies recovery events separately from ordinary successes.
  private snapshot: ConnectionSnapshot = {
    status: 'idle',
    showWaiting: false,
    recoveryCount: 0,
  }
  private listeners = new Set<() => void>()
  // One flight represents the whole round, including its retry delays. Forms
  // and browser events can await this same promise without starting more pings.
  private flight: {
    controller: AbortController
    promise: Promise<boolean>
  } | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private waitingTimer: ReturnType<typeof setTimeout> | undefined
  // null means "no contact yet"; zero is a valid timestamp in a test clock.
  // Success controls freshness, while attempt time controls automatic throttling.
  private lastSuccess: number | null = null
  private lastAttempt: number | null = null
  private needsRecovery = false
  private started = false
  private readonly probe: HealthProbe

  constructor(probe: HealthProbe = probeHealth) {
    // Inject only the network operation. Tests can control its result while
    // exercising the actual scheduling, retries, and cancellation logic.
    this.probe = probe
  }

  // useSyncExternalStore needs the same object until state actually changes.
  // Creating a new object here would make an unchanged store appear updated.
  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private update(status: ConnectionSnapshot['status'], showWaiting = false) {
    // Replace the snapshot before notifying subscribers so every reader sees
    // the new state. Mutating the old object would hide the change from React.
    this.snapshot = { ...this.snapshot, status, showWaiting }
    this.listeners.forEach((listener) => listener())
  }

  private usable() {
    // onLine is only a browser hint. It allows a check; the health response is
    // what proves server availability. Hidden tabs do not schedule background work.
    return navigator.onLine && document.visibilityState !== 'hidden'
  }

  private schedule = () => {
    clearTimeout(this.timer)
    if (this.started && this.usable()) {
      // A one-shot timeout schedules again after the round settles. Unlike a
      // fixed interval, it does not repeatedly fire during a long cold start.
      this.timer = setTimeout(() => {
        void this.check().finally(this.schedule)
      }, CONNECTION_INTERVAL)
    }
  }

  private resume = () => {
    // Restart the timer and ask for a check; check itself decides whether the
    // last contact is fresh, another round exists, or the cooldown still applies.
    this.schedule()
    if (this.usable()) void this.check()
  }

  private offline = () => {
    // A recent success describes the old network connection. Discard it and
    // the cooldown so coming back online can trigger a check immediately.
    this.lastSuccess = null
    this.lastAttempt = null
    this.needsRecovery = true
    this.cancelRound()
    clearTimeout(this.timer)
    this.update('offline')
  }

  start() {
    if (this.started) return
    this.started = true
    // These events cover different return paths: a tab becoming visible, a
    // window regaining focus, a restored page, and a recovered network link.
    document.addEventListener('visibilitychange', this.resume)
    window.addEventListener('focus', this.resume)
    window.addEventListener('pageshow', this.resume)
    window.addEventListener('online', this.resume)
    window.addEventListener('offline', this.offline)
    if (!navigator.onLine) this.offline()
    else this.resume()
  }

  stop() {
    this.started = false
    document.removeEventListener('visibilitychange', this.resume)
    window.removeEventListener('focus', this.resume)
    window.removeEventListener('pageshow', this.resume)
    window.removeEventListener('online', this.resume)
    window.removeEventListener('offline', this.offline)
    clearTimeout(this.timer)
    this.cancelRound()
    // StrictMode may immediately mount again. An intentional cancellation must
    // not count as a failure or prevent the next mount from checking promptly.
    this.lastAttempt = null
    this.lastSuccess = null
    this.needsRecovery = false
    this.update('idle')
  }

  private cancelRound() {
    this.flight?.controller.abort()
    // Release ownership immediately. An aborted fetch may reject later; a new
    // mount or reconnection must be able to start a replacement before that.
    this.flight = null
    clearTimeout(this.waitingTimer)
  }

  recordSuccess = () => {
    this.lastSuccess = Date.now()
    // An ordinary request also proves reachability. Let an ongoing health round
    // finish before notifying recovery, so events cannot race with that round.
    if (!this.flight && navigator.onLine) this.ready()
  }

  recordFailure = () => {
    // Axios reports only temporary errors here. Invalidate reachability without
    // touching authentication or query data; each consumer still receives its error.
    this.lastSuccess = null
    this.needsRecovery = true
    if (!navigator.onLine) return this.offline()
    if (!this.flight) {
      this.update('unavailable')
      if (this.started && this.usable()) void this.check()
    }
  }

  private ready() {
    this.lastSuccess = Date.now()
    if (this.needsRecovery) {
      // Count a recovery once after a detected failure. Incrementing for every
      // successful ping would needlessly refetch queries during normal use.
      this.snapshot = {
        ...this.snapshot,
        recoveryCount: this.snapshot.recoveryCount + 1,
      }
      this.needsRecovery = false
    }
    this.update('ready')
  }

  check = (force = false): Promise<boolean> => {
    if (!navigator.onLine) {
      this.offline()
      return Promise.resolve(false)
    }
    // Even a forced check shares ongoing work. "Force" bypasses scheduling
    // restrictions below, not deduplication or the browser's offline state.
    if (this.flight) return this.flight.promise
    const now = Date.now()
    if (!force) {
      if (!this.usable()) return Promise.resolve(false)
      if (
        this.lastSuccess !== null &&
        now - this.lastSuccess < CONNECTION_INTERVAL
      )
        return Promise.resolve(true)
      if (
        this.lastAttempt !== null &&
        now - this.lastAttempt < AUTOMATIC_COOLDOWN
      )
        return Promise.resolve(false)
    }

    this.lastAttempt = now
    const controller = new AbortController()
    this.update('checking')
    // Delay only the notice, never the network request. Fast responses remain
    // unobtrusive; a slow round exposes waiting without blocking page rendering.
    this.waitingTimer = setTimeout(
      () => this.update('checking', true),
      WAITING_DELAY,
    )
    const promise = this.runRound(controller)
    this.flight = { controller, promise }
    return promise
  }

  ensureReady = async (): Promise<boolean> => {
    // Forms use this gate instead of inspecting status themselves: "ready"
    // alone can be outdated after a long absence. Await an existing round first.
    if (this.flight) return this.flight.promise
    if (
      this.snapshot.status === 'ready' &&
      navigator.onLine &&
      this.lastSuccess !== null &&
      Date.now() - this.lastSuccess < CONNECTION_INTERVAL
    )
      return true
    // A deliberate submission can request a fresh round immediately. Returning
    // false lets the mutation stop before it sends any credentials or account data.
    return this.check(true)
  }

  private async runRound(controller: AbortController): Promise<boolean> {
    try {
      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
        if (controller.signal.aborted) return false
        // The round controller lives across attempts; each attempt gets a new
        // deadline controller so one timeout does not cancel subsequent retries.
        const timeout = new AbortController()
        const timer = setTimeout(() => timeout.abort(), HEALTH_TIMEOUT)
        const clearDeadline = () => clearTimeout(timer)
        controller.signal.addEventListener('abort', clearDeadline, {
          once: true,
        })
        try {
          // Either signal can stop the request: cleanup cancels the round,
          // while the deadline cancels only this attempt, including body parsing.
          await this.probe(AbortSignal.any([controller.signal, timeout.signal]))
          // Cleanup may race with a successful response. A cancelled round must
          // not announce availability after another round has taken ownership.
          if (controller.signal.aborted) return false
          this.ready()
          return true
        } catch {
          // Intentional cancellation ends quietly; a failed attempt or timeout
          // falls through to a delay and retry. Neither proves session expiration.
          if (controller.signal.aborted) return false
        } finally {
          clearTimeout(timer)
          controller.signal.removeEventListener('abort', clearDeadline)
        }
        if (attempt < RETRY_DELAYS.length)
          await pause(RETRY_DELAYS[attempt], controller.signal)
      }
      // Only exhausted attempts publish a final health failure. The next
      // successful contact will then notify consumers that recovery occurred.
      this.needsRecovery = true
      this.update('unavailable')
      return false
    } finally {
      // A cancelled round can finish after a replacement has started. It must
      // never clear the replacement's timers or publish a stale result.
      if (this.flight?.controller === controller) {
        this.flight = null
        clearTimeout(this.waitingTimer)
        this.schedule()
      }
    }
  }
}

// The module instance outlives individual routes. Provider subscriptions and
// Axios interceptors therefore observe the same connection history and flight.
export const backendConnection = new BackendConnection()
