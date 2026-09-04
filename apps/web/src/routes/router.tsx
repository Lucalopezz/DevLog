import { createBrowserRouter } from 'react-router'
import LoginPage from '@/features/auth/pages/login-page'
import HomePage from '@/features/home/pages/home-page'
import { RootLayout } from './root-layout'
import { redirectAuthenticatedUser, requireUser } from './require-user'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Rotas públicas
      {
        path: '/login',
        loader: redirectAuthenticatedUser,
        Component: LoginPage,
      },
      // Rotas privadas
      {
        loader: requireUser,
        children: [
          {
            index: true,
            Component: HomePage,
          },
        ],
      },
    ],
  },
])
