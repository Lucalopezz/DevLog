import { api } from '@/api/http'
import type { User } from '../types/auth'

export const currentUserQueryKey = ['currentUser', 'auth'] as const

export async function getCurrentUser({
  signal,
}: { signal?: AbortSignal } = {}): Promise<User> {
  // TanStack Query passes its context, including signal, when used as queryFn.
  // Forwarding that signal makes cancelQueries abort HTTP work as well as cache
  // updates. The default argument also permits direct calls outside a query.
  const { data } = await api.get<User>('/users/me', { signal })
  return data
}
