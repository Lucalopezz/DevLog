import type { QueryClient } from '@tanstack/react-query'
import type { RouteObject } from 'react-router'

import AccountPage from '@/features/auth/pages/account-page'
import SettingsPage from '@/features/auth/pages/settings-page'
import LoginPage from '@/features/auth/pages/login-page'
import RegisterPage from '@/features/auth/pages/register-page'
import HomePage from '@/features/home/pages/home-page'
import LandingPage from '@/features/landing/pages/landing-page'
import ProjectDetailPage from '@/features/projects/pages/project-detail-page'
import ProjectsPage from '@/features/projects/pages/projects-page'
import TagsPage from '@/features/tags/pages/tags-page'
import TechnologiesPage from '@/features/technologies/pages/technologies-page'
import ArchivedTechnicalEntriesPage from '@/features/technical-entry/pages/technical-entry-archived-page'
import TechnicalEntryDetailPage from '@/features/technical-entry/pages/technical-entry-detail-page'
import TechnicalEntriesPage from '@/features/technical-entry/pages/technical-entries-page'

import { GuestOnlyRoute } from './guest-only-route'
import { RootLayout } from './root-layout'
import { createAuthLoaders } from './require-user'

/**
 * Builds the production route tree around the supplied cache.
 *
 * Both loaders and React Query providers must use the same QueryClient. This
 * factory keeps that dependency explicit while production still supplies its
 * single long-lived client in router.tsx.
 */
export function createAppRoutes(client: QueryClient): RouteObject[] {
  const { requireUser } = createAuthLoaders(client)

  return [
    {
      // The fallback prevents protected routes from flashing before their
      // session loader resolves. Public routes have no blocking loader.
      HydrateFallback: () => null,
      children: [
        {
          index: true,
          Component: LandingPage,
        },
        {
          element: <GuestOnlyRoute />,
          children: [
            { path: '/login', Component: LoginPage },
            { path: '/register', Component: RegisterPage },
          ],
        },
        {
          loader: requireUser,
          element: <RootLayout />,
          children: [
            { path: 'dashboard', Component: HomePage },
            { path: 'account', Component: AccountPage },
            { path: 'settings', Component: SettingsPage },
            { path: 'projects', Component: ProjectsPage },
            { path: 'projects/:projectId', Component: ProjectDetailPage },
            { path: 'technical-entries', Component: TechnicalEntriesPage },
            {
              path: 'technical-entries/:technicalEntryId',
              Component: TechnicalEntryDetailPage,
            },
            {
              path: 'technical-entries/archived',
              Component: ArchivedTechnicalEntriesPage,
            },
            { path: 'tags', Component: TagsPage },
            { path: 'technologies', Component: TechnologiesPage },
          ],
        },
      ],
    },
  ]
}
