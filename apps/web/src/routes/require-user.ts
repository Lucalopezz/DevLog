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
        retry: false,
      })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw redirect('/login')
      }

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

      throw redirect('/')
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
