import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { useGetUser } from '@/features/auth/hooks/use-get-user'

export function ProtectedSession({ children }: { children: ReactNode }) {
  // This observer uses the same profile query as the loader and sidebar. It
  // can react to a later 401 even after the initial route loader has succeeded.
  const { error } = useGetUser()
  const client = useQueryClient()
  const navigate = useNavigate()
  const expired = isAxiosError(error) && error.response?.status === 401

  useEffect(() => {
    if (!expired) return
    let cancelled = false
    // Only an explicit authentication rejection clears user-scoped state.
    // Network failures leave both the session cookie and existing data intact.
    // Cancel before clearing: an older request could otherwise finish afterward
    // and repopulate the cache with data belonging to the expired session.
    void client.cancelQueries().then(() => {
      if (cancelled) return
      client.clear()
      void navigate('/login', { replace: true })
    })
    return () => {
      // Cancellation is asynchronous. If this component unmounts first, its
      // continuation must not clear a newer screen's cache or redirect it.
      cancelled = true
    }
  }, [client, expired, navigate])

  // Hide the private subtree during the confirmed-expiration redirect; a
  // temporary connectivity error keeps it mounted, including unsaved drafts.
  return expired ? null : children
}
