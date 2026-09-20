import { Cpu, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectTechnology } from "@/features/projects/types/project";
import { useRemoveProjectTechnology } from "../hooks/use-project-technology-mutations";
import { ProjectTechnologyDeleteButton } from "./project-technology-delete-button";
import { ProjectTechnologyForm } from "./project-technology-form";

export function ProjectTechnologiesSection({
  isArchived,
  projectId,
  technologies,
}: {
  isArchived: boolean;
  projectId: string;
  technologies: ProjectTechnology[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const removeMutation = useRemoveProjectTechnology(projectId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {technologies.length.toLocaleString("en-US")} technology(ies)
          recorded.
        </p>
        <Button
          disabled={isArchived}
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          <Plus data-icon="inline-start" />
          Add technology
        </Button>
      </div>

      <ProjectTechnologyForm
        onOpenChange={setIsFormOpen}
        open={isFormOpen}
        projectId={projectId}
      />

      {technologies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
          <Cpu className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No technologies have been recorded for this project yet.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((technology) => (
            <li key={technology.id}>
              <article className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Cpu className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{technology.name}</h3>
                    {technology.version ? (
                      <p className="text-sm text-muted-foreground">
                        Version {technology.version}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Version not specified
                      </p>
                    )}
                  </div>
                </div>
                <ProjectTechnologyDeleteButton
                  disabled={isArchived}
                  isPending={
                    removeMutation.isPending &&
                    removeMutation.variables === technology.id
                  }
                  name={technology.name}
                  onDelete={() => removeMutation.mutateAsync(technology.id)}
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
