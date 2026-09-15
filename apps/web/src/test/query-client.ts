import { QueryClient } from '@tanstack/react-query'

const clients = new Set<QueryClient>()

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })

  clients.add(client)
  return client
}

export async function disposeTestQueryClients() {
  for (const client of clients) {
    // Cancel before clearing so an in-flight response cannot repopulate the
    // cache after the next test has already started.
    await client.cancelQueries()
    client.clear()
  }

  clients.clear()
}
