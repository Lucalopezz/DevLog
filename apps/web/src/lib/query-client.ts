import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long cached data remains fresh before it becomes stale
      // This does not mean data is removed from the cache after that time; 
      // only that it becomes stale and can be refetched if needed
      staleTime: 30_000,
      // Disables automatic refetching when the browser window gains focus
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // For Axios errors with a response status below 500, do not retry the request
        // Client errors (4xx) should be handled differently from server errors (5xx)
        if (isAxiosError(error) && error.response?.status && error.response.status < 500) {
          return false
        }
        // Allows up to 2 retries after an error
        return failureCount < 2
      },
    },
  },
})
