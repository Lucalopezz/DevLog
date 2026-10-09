import { createContext, useContext } from 'react'

import { backendConnection } from '@/lib/backend-connection'

// Context exposes commands on the shared controller. Components that need live
// status must also subscribe to its snapshots; reading context alone is not reactive.
export const BackendConnectionContext = createContext(backendConnection)

export function useBackendConnection() {
  return useContext(BackendConnectionContext)
}
