import axios from 'axios'
import { backendConnection } from '@/lib/backend-connection'
import { isTemporaryApiError } from '@/lib/is-temporary-api-error'

import { API_URL } from './api-url'

export { API_URL } from './api-url'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Limit reads without changing write semantics: a lost write response does
  // not prove the operation failed, so Axios never repeats a mutation.
  // The interceptor runs for every feature's request, avoiding timeout logic in
  // each API helper. A nonzero deadline explicitly supplied by a caller wins.
  if (['get', 'head'].includes(config.method ?? 'get') && !config.timeout) {
    config.timeout = 15_000
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Business traffic also reaches the server, so a successful read or write
    // can refresh connection history without an additional health request.
    backendConnection.recordSuccess()
    return response
  },
  (error: unknown) => {
    if (isTemporaryApiError(error)) backendConnection.recordFailure()
    else if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status < 500
    ) {
      // A 401 proves the server is reachable, but says nothing about health of
      // the session. Authentication consumers still receive the original error.
      backendConnection.recordSuccess()
    }
    // Reporting connectivity is a side effect, not error handling for the
    // operation. Propagate the same error to query, mutation, and auth consumers.
    return Promise.reject(error)
  },
)
