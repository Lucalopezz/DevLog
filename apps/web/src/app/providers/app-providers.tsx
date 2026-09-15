import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { lazy, Suspense, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient as productionQueryClient } from '@/lib/query-client'

// In DEV, asynchronously imports ReactQueryDevtools; otherwise, sets it to null
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import("@tanstack/react-query-devtools");

      return { default: module.ReactQueryDevtools };
    })
  : null;

interface AppProvidersProps {
  children: ReactNode
  client?: QueryClient
  showDevtools?: boolean
}

export function AppProviders({
  children,
  client = productionQueryClient,
  showDevtools = import.meta.env.DEV,
}: AppProvidersProps) {
  return (
    <TooltipProvider>
      <QueryClientProvider client={client}>
        {children}
        <Toaster closeButton position="top-right" richColors theme="dark" />
        {showDevtools && ReactQueryDevtools ? (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </TooltipProvider>
  )
}
