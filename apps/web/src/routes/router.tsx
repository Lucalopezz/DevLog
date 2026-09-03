import { createBrowserRouter } from 'react-router'
import LoginPage from '@/features/auth/pages/login-page'
import HomePage from '@/features/home/pages/home-page'

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: HomePage,
  },
])
