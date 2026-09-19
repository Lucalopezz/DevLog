import { useGetUser } from "@/features/auth/hooks/use-get-user";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTags } from "@/features/tags/hooks/use-tags";
import { useTechnicalEntries } from "@/features/technical-entry/hooks/use-technical-entries";
import { HomeHero } from "../components/home-hero";
import { RecentEntriesSection } from "../components/recent-entries-section";
import { RecentProjectsSection } from "../components/recent-projects-section";
import { WorkspaceSummary } from "../components/workspace-summary";

const recentProjectsParams = {
  page: 1,
  perPage: 3,
  archivedAt: "null",
  sort: "updatedAt",
  sortDir: "desc",
} as const;

const recentEntriesParams = {
  page: 1,
  perPage: 5,
  archivedAt: "null",
  sort: "updatedAt",
  sortDir: "desc",
} as const;

const openIssuesParams = {
  page: 1,
  perPage: 1,
  archivedAt: "null",
  type: "ISSUE",
  status: "OPEN",
} as const;

const tagCountParams = { page: 1, perPage: 1 } as const;

function HomePage() {
  // The page coordinates remote data. Presentational components receive only
  // the data and states they need, so layout concerns stay independent from
  // React Query and remain easier to evolve or test in isolation.
  const { data: user } = useGetUser();
  const projects = useProjects(recentProjectsParams);
  const entries = useTechnicalEntries(recentEntriesParams);
  const openIssues = useTechnicalEntries(openIssuesParams);
  const tags = useTags(tagCountParams);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <HomeHero userName={user?.name} />

      {/* Totals come from pagination metadata. The dashboard therefore fetches
          only the records it renders instead of downloading complete lists. */}
      <WorkspaceSummary
        entries={{
          isPending: entries.isPending,
          total: entries.data?.meta.total,
        }}
        openIssues={{
          isPending: openIssues.isPending,
          total: openIssues.data?.meta.total,
        }}
        projects={{
          isPending: projects.isPending,
          total: projects.data?.meta.total,
        }}
        tags={{ isPending: tags.isPending, total: tags.data?.meta.total }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <RecentEntriesSection
          entries={entries.data?.data}
          isError={entries.isError}
          isPending={entries.isPending}
        />
        <RecentProjectsSection
          isError={projects.isError}
          isPending={projects.isPending}
          projects={projects.data?.data}
        />
      </div>
    </main>
  );
}

export default HomePage;
