import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'

import { useGetUser } from '@/features/auth/hooks/use-get-user'

/**
 * Keeps login and registration immediately usable while checking for an
 * existing session in the background. A slow API delays the redirect, not
 * the form itself.
 */
export function GuestOnlyRoute() {
  const { data: user, error } = useGetUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !error) {
      navigate('/dashboard', { replace: true })
    }
  }, [error, navigate, user])

  return <Outlet />
}
