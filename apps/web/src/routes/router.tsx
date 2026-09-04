import { createBrowserRouter } from 'react-router'
import LoginPage from '@/features/auth/pages/login-page'
import AccountPage from '@/features/auth/pages/account-page'
import RegisterPage from '@/features/auth/pages/register-page'
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
      {
        path: '/register',
        loader: redirectAuthenticatedUser,
        Component: RegisterPage,
      },
      // Rotas privadas
      {
        loader: requireUser,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: 'account',
            Component: AccountPage,
          },
        ],
      },
    ],
  },
])
