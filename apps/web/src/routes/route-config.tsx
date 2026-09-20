import type { QueryClient } from '@tanstack/react-query'
import type { RouteObject } from 'react-router'

import AccountPage from '@/features/auth/pages/account-page'
import LoginPage from '@/features/auth/pages/login-page'
import RegisterPage from '@/features/auth/pages/register-page'
import HomePage from '@/features/home/pages/home-page'
import ProjectDetailPage from '@/features/projects/pages/project-detail-page'
import ProjectsPage from '@/features/projects/pages/projects-page'
import TagsPage from '@/features/tags/pages/tags-page'
import TechnologiesPage from '@/features/technologies/pages/technologies-page'
import ArchivedTechnicalEntriesPage from '@/features/technical-entry/pages/technical-entry-archived-page'
import TechnicalEntryDetailPage from '@/features/technical-entry/pages/technical-entry-detail-page'
import TechnicalEntriesPage from '@/features/technical-entry/pages/technical-entries-page'

import { createAuthLoaders } from './require-user'
import { RootLayout } from './root-layout'

/**
 * Builds the production route tree around the supplied cache.
 *
 * Both loaders and React Query providers must use the same QueryClient. This
 * factory keeps that dependency explicit while production still supplies its
 * single long-lived client in router.tsx.
 */
export function createAppRoutes(client: QueryClient): RouteObject[] {
  const { redirectAuthenticatedUser, requireUser } = createAuthLoaders(client)

  return [
    {
      element: <RootLayout />,
      // Data routers render this boundary while initial loaders resolve. The
      // existing application intentionally waits for the session before
      // revealing a public or private screen, so the fallback stays empty.
      HydrateFallback: () => null,
      children: [
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
        {
          loader: requireUser,
          children: [
            { index: true, Component: HomePage },
            { path: 'account', Component: AccountPage },
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
