import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'

import { createTestQueryClient } from './query-client'

export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  const client = createTestQueryClient()
  const user = userEvent.setup()

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={client}>
        <TooltipProvider>
          {ui}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )

  return { ...result, user, client }
}
