import { createBrowserRouter } from 'react-router'
import HomePage from '@/features/home/pages/home-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
  },
])
