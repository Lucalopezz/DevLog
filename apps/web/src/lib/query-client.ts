import { QueryClient } from '@tanstack/react-query'
import { retryRead } from './is-temporary-api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long cached data remains fresh before it becomes stale
      // This does not mean data is removed from the cache after that time;
      // only that it becomes stale and can be refetched if needed
      staleTime: 30_000,
      // Query's default focus/reconnect behavior refreshes stale mounted reads
      // directly, including the session profile, without background health pings.
      retry: retryRead,
    },
    // Losing a response does not tell us whether a write reached the database.
    // Automatic repeats would require server-side idempotency guarantees first.
    mutations: { retry: false },
  },
})
