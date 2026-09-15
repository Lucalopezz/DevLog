import { setupServer } from 'msw/node'

// Tests opt into every response they need. This avoids a permissive fake API
// whose defaults could let an incomplete scenario pass accidentally.
export const server = setupServer()
