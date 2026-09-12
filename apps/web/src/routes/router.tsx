import { createBrowserRouter } from "react-router";
import LoginPage from "@/features/auth/pages/login-page";
import AccountPage from "@/features/auth/pages/account-page";
import RegisterPage from "@/features/auth/pages/register-page";
import HomePage from "@/features/home/pages/home-page";
import { RootLayout } from "./root-layout";
import { redirectAuthenticatedUser, requireUser } from "./require-user";
import ProjectsPage from "@/features/projects/pages/projects-page";
import ProjectDetailPage from "@/features/projects/pages/project-detail-page";
import TechnicalEntriesPage from "@/features/technical-entry/pages/technical-entries-page";
import TechnicalEntryDetailPage from "@/features/technical-entry/pages/technical-entry-detail-page";
import ArchivedTechnicalEntriesPage from "@/features/technical-entry/pages/technical-entry-archived-page";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: "/login",
        loader: redirectAuthenticatedUser,
        Component: LoginPage,
      },
      {
        path: "/register",
        loader: redirectAuthenticatedUser,
        Component: RegisterPage,
      },
      // Private routes
      {
        loader: requireUser,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: "account",
            Component: AccountPage,
          },
          {
            path: "projects",
            Component: ProjectsPage,
          },
          {
            path: "projects/:projectId",
            Component: ProjectDetailPage,
          },
          {
            path: "technical-entries",
            Component: TechnicalEntriesPage,
          },
          {
            path: "technical-entries/:technicalEntryId",
            Component: TechnicalEntryDetailPage,
          },
          {
            path: "technical-entries/archived",
            Component: ArchivedTechnicalEntriesPage,
          },
        ],
      },
    ],
  },
]);
