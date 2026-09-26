import { Plus, RefreshCw } from "lucide-react";
import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  DetailPagination,
  EmptySection,
  LoadingSection,
  SectionError,
} from "@/features/projects/components/project-detail-section-ui";
import { ProjectDetailSectionFrame } from "@/features/projects/components/project-detail-section-frame";
import {
  environmentCategoryLabel,
  environmentRuntimeSummary,
} from "../presentation";
import type { ProjectEnvironment } from "../types/environment";
import { ProjectEnvironmentDeleteButton } from "./project-environment-delete-button";

export function ProjectEnvironmentsTab({
  environments,
  isArchived,
  isError,
  isFetching,
  isPending,
  meta,
  onAdd,
  onDeleted,
  onEdit,
  onPageChange,
  onRetry,
  projectId,
}: {
  environments?: ProjectEnvironment[];
  isArchived: boolean;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  meta?: Meta;
  onAdd: () => void;
  onDeleted: () => void;
  onEdit: (environment: ProjectEnvironment) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  projectId: string;
}) {
  return (
    <ProjectDetailSectionFrame
      action={
        <Button disabled={isArchived} onClick={onAdd} type="button">
          <Plus data-icon="inline-start" />
          New environment
        </Button>
      }
      description="Execution and deployment contexts documented for this project."
      title="Environments"
    >
      {isArchived ? (
        <p className="text-sm text-muted-foreground">
          This project is archived. Environments are read-only until it is
          restored.
        </p>
      ) : null}
      {isFetching && !isPending ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="size-4 animate-spin" />
          Updating environments...
        </p>
      ) : null}
      {isPending ? (
        <LoadingSection />
      ) : isError ? (
        <SectionError onRetry={onRetry} />
      ) : environments?.length ? (
        <div className="space-y-4">
          <ul className="grid gap-3 sm:grid-cols-2">
            {environments.map((environment) => (
              <li key={environment.id}>
                <article className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium">{environment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {environmentCategoryLabel(environment.category)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        aria-label={`Edit ${environment.name}`}
                        disabled={isArchived}
                        onClick={() => onEdit(environment)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <ProjectEnvironmentDeleteButton
                        disabled={isArchived}
                        environmentId={environment.id}
                        name={environment.name}
                        onDeleted={onDeleted}
                        projectId={projectId}
                      />
                    </div>
                  </div>
                  <p className="text-sm">
                    {environment.operatingSystem ||
                      "Operating system not specified"}{" "}
                    ·{" "}
                    {environmentRuntimeSummary(
                      environment.runtime,
                      environment.runtimeVersion,
                    )}
                  </p>
                  {environment.description ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {environment.description}
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
          <DetailPagination
            isFetching={isFetching}
            meta={meta}
            onPageChange={onPageChange}
          />
        </div>
      ) : (
        <EmptySection>No environments have been recorded yet.</EmptySection>
      )}
    </ProjectDetailSectionFrame>
  );
}
