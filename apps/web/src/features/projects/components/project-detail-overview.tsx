import { BookOpenText, Boxes, CircleDot, Code2, ExternalLink } from "lucide-react";
import { formatRelativeDate } from "@/lib/date";
import { presentProjectStatus } from "../presentation";
import type { Project } from "../types/project";

type ProjectDetailOverviewProps = {
  project: Project;
  technicalEntriesTotal?: number;
  commandsTotal?: number;
  resourcesTotal?: number;
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
      <Icon className="mb-5 size-5 text-primary" />
      <p className="text-2xl font-semibold tracking-tight">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProjectDetailOverview({
  project,
  technicalEntriesTotal,
  commandsTotal,
  resourcesTotal,
}: ProjectDetailOverviewProps) {
  const status = presentProjectStatus(project.status);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <BookOpenText className="size-5 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">About the project</h2>
              <p className="text-sm text-muted-foreground">Context to get back to work</p>
            </div>
          </div>

          <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-card-foreground/80">
            {project.description || "This project does not have a description yet."}
          </p>

          <dl className="mt-8 grid gap-4 border-t border-border/60 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Current status</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <CircleDot className="size-4 text-primary" />
                <span className={status.className.split(" ")[1]}>{status.label}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="mt-1 font-medium">
                <time dateTime={project.updatedAt}>{formatRelativeDate(project.updatedAt)}</time>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Code2 className="size-5 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Technologies</h2>
              <p className="text-sm text-muted-foreground">Recorded stack</p>
            </div>
          </div>

          {project.technologies?.length ? (
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((technology) => (
                <li
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  key={technology.id}
                >
                  <span className="font-medium">{technology.name}</span>
                  {technology.version ? (
                    <span className="ml-1.5 text-muted-foreground">{technology.version}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No technologies have been recorded yet.
            </p>
          )}
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {/* Totals come from meta.total, not the current page size. This keeps
            the summary accurate even when the collection is paginated. */}
        <Metric icon={Boxes} label="Technical entries" value={technicalEntriesTotal} />
        <Metric icon={Code2} label="Commands" value={commandsTotal} />
        <Metric icon={ExternalLink} label="Resources" value={resourcesTotal} />
      </section>
    </div>
  );
}
