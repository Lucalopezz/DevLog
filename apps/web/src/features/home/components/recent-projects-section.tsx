import { ArrowRight, FolderKanban } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { presentProjectStatus } from "@/features/projects/presentation";
import type { Project } from "@/features/projects/types/project";
import { formatRelativeDate } from "@/lib/date";

type RecentProjectsSectionProps = {
  projects?: Project[];
  isPending: boolean;
  isError: boolean;
};

function ProjectRow({ project }: { project: Project }) {
  const status = presentProjectStatus(project.status);

  return (
    <li>
      <Link
        className="group block rounded-xl border bg-background/60 p-4 transition-colors hover:border-foreground/20 hover:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to={`/projects/${project.id}`}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate font-medium">{project.name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Updated {formatRelativeDate(project.updatedAt)}
            </span>
          </span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function RecentProjectsSection({
  projects,
  isPending,
  isError,
}: RecentProjectsSectionProps) {
  return (
    <section
      aria-labelledby="recent-projects-title"
      className="rounded-2xl border bg-muted/30 p-4 shadow-sm sm:p-6"
    >
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            In progress
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            id="recent-projects-title"
          >
            Recent projects
          </h2>
        </div>
        <Button
          aria-label="View all projects"
          asChild
          size="icon-sm"
          variant="ghost"
        >
          <Link to="/projects">
            <ArrowRight />
          </Link>
        </Button>
      </header>

      {isPending ? (
        <div
          aria-label="Loading recent projects"
          className="space-y-3"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <div
              className="h-20 animate-pulse rounded-xl bg-muted"
              key={item}
            />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl bg-background p-5 text-sm text-muted-foreground">
          Recent projects are unavailable right now.
        </p>
      ) : projects?.length ? (
        <ul className="space-y-3">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed bg-background/50 p-6 text-center">
          <FolderKanban className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-medium">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a project to connect journal entries to real work.
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link to="/projects">Go to projects</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
