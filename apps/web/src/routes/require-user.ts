import type { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { redirect } from 'react-router'

import {
  currentUserQueryKey,
  getCurrentUser,
} from '@/features/auth/api/get-current-user'
import type { User } from '@/features/auth/types/auth'

/**
 * Runs before every protected route.
 *
 * `query` is the API recommended by the current TanStack Query version. It uses the
 * same cache as `useGetUser`, without creating a second source of truth.
 */
export function createAuthLoaders(client: QueryClient) {
  async function requireUser(): Promise<User> {
    try {
      return await client.query({
        queryKey: currentUserQueryKey,
        queryFn: getCurrentUser,
        // Let the route error boundary coordinate recovery with the shared
        // health round instead of adding a separate loader retry sequence.
        retry: false,
      })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        // A confirmed invalid session must not leave another account's cached
        // workspace available after the next login. Temporary errors skip this.
        await client.cancelQueries()
        client.clear()
        throw redirect('/login')
      }

      // Propagate temporary failures to the route error boundary. Treating them
      // as "no user" would send a valid session to login during a cold start.
      throw error
    }
  }

  /**
   * Loader for pages intended only for guests.
   * A 401 response is expected here: it means there is no session.
   */
  async function redirectAuthenticatedUser(): Promise<void> {
    try {
      await client.query({
        queryKey: currentUserQueryKey,
        queryFn: getCurrentUser,
        retry: false,
      })

      throw redirect('/dashboard')
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        return
      }

      // A redirect is a deliberately thrown Response. Only an API 401 means
      // "continue as guest"; every other failure must reach the router.
      throw error
    }
  }

  return { redirectAuthenticatedUser, requireUser }
}
