import { setupServer } from 'msw/node'

// Every API request needs an explicit handler so unexpected traffic fails.
export const server = setupServer()
