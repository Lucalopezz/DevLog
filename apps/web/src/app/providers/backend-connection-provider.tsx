import { useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, WifiOff } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  backendConnection,
  type BackendConnection,
} from '@/lib/backend-connection'
import { isTemporaryApiError } from '@/lib/is-temporary-api-error'
import { currentUserQueryKey } from '@/features/auth/api/get-current-user'

import { BackendConnectionContext } from './backend-connection-context'

export function BackendConnectionProvider({
  children,
  connection = backendConnection,
}: {
  children: ReactNode
  connection?: BackendConnection
}) {
  const client = useQueryClient()
  // The controller owns asynchronous work outside React. This hook connects its
  // immutable snapshots to rendering without duplicating that state in useState.
  const snapshot = useSyncExternalStore(
    connection.subscribe,
    connection.getSnapshot,
  )
  // A ref remembers which recovery this consumer has handled without causing
  // another render. Starting with the current count ignores past recovery events.
  const previousRecovery = useRef(snapshot.recoveryCount)

  useEffect(() => {
    // This effect owns browser listeners/timers. Subscription alone only reads
    // the store; start/stop make its lifecycle follow the global provider.
    connection.start()
    return () => connection.stop()
  }, [connection])

  useEffect(() => {
    if (previousRecovery.current === snapshot.recoveryCount) return
    // Mark the event handled before refetching, since those requests can publish
    // more connection snapshots through the Axios interceptors.
    previousRecovery.current = snapshot.recoveryCount
    // Preserve cached data and forms. Only mounted, failed reads are eligible;
    // 401/404/business errors and mutations cannot be replayed by recovery.
    void client.refetchQueries({
      // An active query has a mounted observer. Refetching inactive entries
      // would load screens the user is not viewing and increase request volume.
      type: 'active',
      predicate: (query) =>
        query.state.status === 'error' &&
        isTemporaryApiError(query.state.error),
    })
  }, [client, snapshot.recoveryCount])

  useEffect(() => {
    if (snapshot.status !== 'ready') return
    // Health never renews a JWT. Once connected, recheck a stale, previously
    // authenticated profile so the private layout can handle a genuine 401.
    // This effect has a different responsibility from error recovery above:
    // previously successful cached auth data can become invalid without an error.
    void client.refetchQueries({
      queryKey: currentUserQueryKey,
      type: 'active',
      predicate: (query) => query.state.status === 'success' && query.isStale(),
    })
  }, [client, snapshot.status])

  // Notices describe connectivity without replacing children, so visible data
  // and unsaved form state survive while a new round is in progress.
  const message =
    snapshot.status === 'offline'
      ? 'You are offline. Check your internet connection.'
      : snapshot.status === 'unavailable'
        ? 'Could not connect. Try again.'
        : snapshot.status === 'checking' && snapshot.showWaiting
          ? 'Waiting for the server…'
          : null

  return (
    <BackendConnectionContext.Provider value={connection}>
      {children}
      {message ? (
        <aside
          aria-label="Connection status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-lg"
        >
          {snapshot.status === 'checking' ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-5 shrink-0 animate-spin"
            />
          ) : (
            <WifiOff aria-hidden="true" className="size-5 shrink-0" />
          )}
          {/* A status live region announces updates politely without moving
              keyboard focus away from the page or a form being completed. */}
          <p role="status" className="flex-1">
            {message}
          </p>
          {snapshot.status === 'unavailable' ? (
            <Button
              onClick={() => {
                void connection.check(true)
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Try again
            </Button>
          ) : null}
        </aside>
      ) : null}
    </BackendConnectionContext.Provider>
  )
}
