import axios from 'axios'

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
