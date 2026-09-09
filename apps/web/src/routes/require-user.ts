import { isAxiosError } from "axios";
import { redirect } from "react-router";
import { currentUserQueryKey, getCurrentUser } from "@/features/auth/api/get-current-user";
import type { User } from "@/features/auth/types/auth";
import { queryClient } from "@/lib/query-client";

/**
 * Runs before every protected route.
 *
 * `query` is the API recommended by the current TanStack Query version. It uses the
 * same cache as `useGetUser`, without creating a second source of truth.
 */
export async function requireUser(): Promise<User> {
  try {
    return await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw redirect('/login');
    }

    throw error;
  }
}

/**
 * Loader for pages intended only for guests.
 * A 401 response is expected here: it means there is no session.
 */
export async function redirectAuthenticatedUser(): Promise<void> {
  try {
    await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })

    throw redirect('/');
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return
    }

    // The redirect is a deliberately thrown Response and must still be
    // handled by React Router.
    throw error
  }
}
