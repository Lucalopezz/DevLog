import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { apiUrl } from './urls'

// Global connection supervision is infrastructure shared by every UI. Feature
// endpoints still require explicit handlers; connection tests override health.
export const server = setupServer(
  http.get(apiUrl('/health'), () => HttpResponse.json({ status: 'ok' })),
)
