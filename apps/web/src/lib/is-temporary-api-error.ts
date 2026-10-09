import { isAxiosError, isCancel } from 'axios'

export function isTemporaryApiError(error: unknown): boolean {
  // Cancellation expresses the caller's intent, not server unavailability.
  // Non-Axios errors can be programming errors and should not trigger retries.
  if (!isAxiosError(error) || isCancel(error)) return false

  // A response lets us classify HTTP status; without one, only known transport
  // and timeout codes qualify. Other statuses may indicate application or input
  // problems rather than temporary connectivity failures, so they are excluded.
  return error.response
    ? [502, 503, 504].includes(error.response.status)
    : ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')
}

// TanStack Query owns read retries. Keeping them out of Axios avoids multiplying
// attempts across two layers, and mutations keep their default single send.
export function retryRead(failureCount: number, error: unknown): boolean {
  // failureCount starts at zero on the first failure: allow one extra attempt,
  // for at most two sends. This policy is applied to reads, never to writes.
  return failureCount < 1 && isTemporaryApiError(error)
}
