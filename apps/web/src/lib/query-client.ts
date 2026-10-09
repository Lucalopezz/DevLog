import { QueryClient } from '@tanstack/react-query'
import { retryRead } from './is-temporary-api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long cached data remains fresh before it becomes stale
      // This does not mean data is removed from the cache after that time;
      // only that it becomes stale and can be refetched if needed
      staleTime: 30_000,
      // Connection supervision already reacts to focus. Disable Query's broad
      // focus refetch so returning to a cold API does not reload every stale query.
      refetchOnWindowFocus: false,
      retry: retryRead,
    },
    // Losing a response does not tell us whether a write reached the database.
    // Automatic repeats would require server-side idempotency guarantees first.
    mutations: { retry: false },
  },
})
