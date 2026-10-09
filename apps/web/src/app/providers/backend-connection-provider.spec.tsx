import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { BackendConnection } from '@/lib/backend-connection'
import { createTestQueryClient } from '@/test/query-client'

import { BackendConnectionProvider } from './backend-connection-provider'

function temporaryError() {
  return new AxiosError('Unavailable', undefined, undefined, undefined, {
    status: 503,
  } as AxiosResponse)
}

function Read({ name, load }: { name: string; load: () => Promise<string> }) {
  const { data, isError } = useQuery({ queryKey: [name], queryFn: load })
  return (
    <p>
      {name}: {data ?? (isError ? 'Failed' : 'Loading')}
    </p>
  )
}

describe('global connection provider', () => {
  it('recovers only active reads with temporary errors and leaves writes and other cache entries alone', async () => {
    const client = createTestQueryClient()
    const connection = new BackendConnection(async () => {})
    const activeRead = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(temporaryError())
      .mockResolvedValue('Recovered')
    const forbiddenRead = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(
        new AxiosError('Unauthorized', undefined, undefined, undefined, {
          status: 401,
        } as AxiosResponse),
      )
    const inactiveRead = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(temporaryError())
    const healthyRead = vi
      .fn<() => Promise<string>>()
      .mockResolvedValue('Existing data')
    const write = vi.fn().mockRejectedValue(temporaryError())
    await client
      .query({ queryKey: ['inactive'], queryFn: inactiveRead })
      .catch(() => {})
    await client
      .getMutationCache()
      .build(client, { mutationFn: write })
      .execute(undefined)
      .catch(() => {})

    render(
      <QueryClientProvider client={client}>
        <BackendConnectionProvider connection={connection}>
          <Read name="active" load={activeRead} />
          <Read name="forbidden" load={forbiddenRead} />
          <Read name="healthy" load={healthyRead} />
        </BackendConnectionProvider>
      </QueryClientProvider>,
    )
    await screen.findByText('active: Failed')
    await screen.findByText('forbidden: Failed')
    await screen.findByText('healthy: Existing data')
    await act(async () => {
      connection.recordFailure()
      await connection.check(true)
    })
    expect(await screen.findByText('active: Recovered')).toBeVisible()
    expect(activeRead).toHaveBeenCalledTimes(2)
    expect(forbiddenRead).toHaveBeenCalledTimes(1)
    expect(inactiveRead).toHaveBeenCalledTimes(1)
    expect(healthyRead).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('keeps mounted content and cached data visible when offline and recovers on reconnect', async () => {
    const client = createTestQueryClient()
    client.setQueryData(['saved'], 'Saved value')
    const connection = new BackendConnection(async () => {})
    render(
      <QueryClientProvider client={client}>
        <BackendConnectionProvider connection={connection}>
          <p>Draft in progress</p>
        </BackendConnectionProvider>
      </QueryClientProvider>,
    )
    await act(async () => {
      await connection.ensureReady()
    })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    act(() => window.dispatchEvent(new Event('offline')))
    expect(screen.getByRole('status')).toHaveTextContent('You are offline.')
    expect(screen.getByText('Draft in progress')).toBeVisible()
    expect(client.getQueryData(['saved'])).toBe('Saved value')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    act(() => window.dispatchEvent(new Event('online')))
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    )
  })

  it('survives StrictMode and aborts the replaced round and the unmounted round', async () => {
    const signals: AbortSignal[] = []
    const connection = new BackendConnection(
      (signal) =>
        new Promise<void>((_resolve, reject) => {
          signals.push(signal)
          signal.addEventListener(
            'abort',
            () => reject(new Error('Cancelled')),
            { once: true },
          )
        }),
    )
    const result = render(
      <StrictMode>
        <QueryClientProvider client={createTestQueryClient()}>
          <BackendConnectionProvider connection={connection}>
            <p>Public content</p>
          </BackendConnectionProvider>
        </QueryClientProvider>
      </StrictMode>,
    )
    expect(signals).toHaveLength(2)
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    result.unmount()
    expect(signals[1].aborted).toBe(true)
  })
})
