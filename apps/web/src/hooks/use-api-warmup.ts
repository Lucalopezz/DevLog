import { useEffect } from 'react'

import { API_URL } from '@/api/http'

export function useApiWarmup() {
  useEffect(() => {
    // Start after the page mounts without waiting for the cold start. Bypassing
    // the cache makes the request reach the server; failures need no UI feedback.
    // Keep it running when navigating away so the next page can benefit too.
    void fetch(`${API_URL}/health`, { cache: 'no-store' }).catch(() => {})
  }, [])
}
