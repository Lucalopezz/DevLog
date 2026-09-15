import { useQuery } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'

import { api } from '@/api/http'

import { server } from './mocks/server'
import { apiUrl } from './mocks/urls'
import { renderWithProviders } from './render-with-providers'

function ServerValue() {
  const query = useQuery({
    queryKey: ['infrastructure-check'],
    queryFn: async () => {
      const response = await api.get<{ value: string }>('/test/value')
      return response.data.value
    },
  })

  return <p>{query.data ?? 'Loading'}</p>
}

it('renders the response declared by the current test', async () => {
  server.use(
    http.get(apiUrl('/test/value'), () =>
      HttpResponse.json({ value: 'First response' }),
    ),
  )

  renderWithProviders(<ServerValue />)

  expect(await screen.findByText('First response')).toBeVisible()
})

it('starts with a fresh DOM and query cache', async () => {
  server.use(
    http.get(apiUrl('/test/value'), () =>
      HttpResponse.json({ value: 'Second response' }),
    ),
  )

  renderWithProviders(<ServerValue />)

  expect(screen.queryByText('First response')).not.toBeInTheDocument()
  expect(await screen.findByText('Second response')).toBeVisible()
})
