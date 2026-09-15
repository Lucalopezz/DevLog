import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AppProviders } from '@/app/providers/app-providers'
import { createAppRoutes } from '@/routes/route-config'

import { createTestQueryClient } from './query-client'
import { trackTestRouter } from './router-registry'

export function renderApp(route = '/') {
  const client = createTestQueryClient()
  const user = userEvent.setup()
  const router = createMemoryRouter(createAppRoutes(client), {
    initialEntries: [route],
  })
  trackTestRouter(router)

  const result = render(
    <AppProviders client={client} showDevtools={false}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return { ...result, user, router, client }
}
