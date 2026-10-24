import { Link, useRevalidator, useRouteError } from 'react-router'

import { Button } from '@/components/ui/button'
import { isTemporaryApiError } from '@/lib/is-temporary-api-error'

export function RouteError() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const temporary = isTemporaryApiError(error)
  const isRetrying = revalidator.state === 'loading'

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Could not load this page</h1>
      <p className="text-muted-foreground">
        {temporary
          ? 'We could not connect. Your session has been preserved. Please try again.'
          : 'Please try again in a moment.'}
      </p>
      <Button
        disabled={isRetrying}
        onClick={() => {
          // Re-run the failed loader itself; readiness cannot predict whether
          // the next authenticated request will succeed.
          void revalidator.revalidate()
        }}
        type="button"
      >
        {isRetrying
          ? 'Trying again…'
          : 'Try loading again'}
      </Button>
      <Link className="text-center underline underline-offset-4" to="/">
        Go to home page
      </Link>
    </main>
  )
}
