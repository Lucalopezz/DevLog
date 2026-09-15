import { createBrowserRouter } from 'react-router'

import { queryClient } from '@/lib/query-client'

import { createAppRoutes } from './route-config'

export const router = createBrowserRouter(createAppRoutes(queryClient))
