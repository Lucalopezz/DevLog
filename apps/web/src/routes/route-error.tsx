import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useRevalidator, useRouteError } from 'react-router'

import { useBackendConnection } from '@/app/providers/backend-connection-context'
import { Button } from '@/components/ui/button'
import { isTemporaryApiError } from '@/lib/is-temporary-api-error'

export function RouteError() {
  const error = useRouteError()
  const connection = useBackendConnection()
  const snapshot = useSyncExternalStore(
    connection.subscribe,
    connection.getSnapshot,
  )
  const previousRecovery = useRef(snapshot.recoveryCount)
  const revalidator = useRevalidator()
  // Router loading starts after the connection gate. Track the gate separately
  // so the retry button stays disabled throughout both phases, not just the read.
  const [isReconnecting, setIsReconnecting] = useState(false)
  const temporary = isTemporaryApiError(error)

  useEffect(() => {
    if (previousRecovery.current === snapshot.recoveryCount) return
    previousRecovery.current = snapshot.recoveryCount
    // Loaders have no mounted query observer, so the provider's active-query
    // recovery cannot reach them. Router revalidation retries the failed read.
    if (temporary) void revalidator.revalidate()
  }, [revalidator, snapshot.recoveryCount, temporary])

  async function retry() {
    setIsReconnecting(true)
    try {
      // For connectivity failures, share or start a health round before reading
      // again. Other route errors can be retried directly; health cannot fix them.
      if (!temporary || (await connection.ensureReady()))
        await revalidator.revalidate()
    } finally {
      // Restore the button state even when no connection was established. The
      // route error remains available, rather than navigating away or losing auth.
      setIsReconnecting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Could not load this page</h1>
      <p className="text-muted-foreground">
        {temporary
          ? 'We could not connect. Your session has been preserved. Please try again.'
          : 'Please try again in a moment.'}
      </p>
      <Button
        disabled={isReconnecting || revalidator.state === 'loading'}
        onClick={() => {
          void retry()
        }}
        type="button"
      >
        {isReconnecting || revalidator.state === 'loading'
          ? 'Trying again…'
          : 'Try loading again'}
      </Button>
      <Link className="text-center underline underline-offset-4" to="/">
        Go to home page
      </Link>
    </main>
  )
}
