import { Plus } from "lucide-react";
import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ProjectTechnologiesSection } from "@/features/technologies/components/project-technologies-section";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";
import type { Project } from "../types/project";
import type { ProjectCommand, ProjectResource } from "../types/project-detail";
import {
  CommandsSection,
  ResourcesSection,
  TechnicalEntriesSection,
} from "./project-detail-sections";
import { ProjectDetailSectionFrame } from "./project-detail-section-frame";

export function ProjectEntriesTab({
  entries,
  isArchived,
  isError,
  isFetching,
  isPending,
  meta,
  onCreate,
  onPageChange,
  onRetry,
}: {
  entries?: TechnicalEntry[];
  isArchived: boolean;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  meta?: Meta;
  onCreate: () => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}) {
  return (
    <ProjectDetailSectionFrame
      action={
        <Button disabled={isArchived} onClick={onCreate} type="button">
          <Plus data-icon="inline-start" />
          New entry
        </Button>
      }
      description="Issues and lessons learned in the context of this project."
      title="Technical entries"
    >
      <TechnicalEntriesSection
        entries={entries}
        isError={isError}
        isFetching={isFetching}
        meta={meta}
        isPending={isPending}
        onRetry={onRetry}
        onPageChange={onPageChange}
      />
    </ProjectDetailSectionFrame>
  );
}

export function ProjectTechnologiesTab({
  isArchived,
  projectId,
  technologies,
}: {
  isArchived: boolean;
  projectId: string;
  technologies: NonNullable<Project["technologies"]>;
}) {
  return (
    <ProjectDetailSectionFrame
      description="Languages, frameworks, databases, and tools used by this project."
      title="Technologies"
    >
      <ProjectTechnologiesSection
        isArchived={isArchived}
        projectId={projectId}
        technologies={technologies}
      />
    </ProjectDetailSectionFrame>
  );
}

export function ProjectCommandsTab({
  commands,
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
  commands?: ProjectCommand[];
  isArchived: boolean;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  meta?: Meta;
  onAdd: () => void;
  onDeleted: () => void;
  onEdit: (command: ProjectCommand) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  projectId: string;
}) {
  return (
    <ProjectDetailSectionFrame
      action={
        <Button disabled={isArchived} onClick={onAdd} type="button">
          <Plus data-icon="inline-start" />
          New command
        </Button>
      }
      description="Recurring commands to set up, run, and maintain the project."
      title="Commands"
    >
      <CommandsSection
        commands={commands}
        isArchived={isArchived}
        isError={isError}
        isFetching={isFetching}
        meta={meta}
        isPending={isPending}
        onRetry={onRetry}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleted={onDeleted}
        projectId={projectId}
      />
    </ProjectDetailSectionFrame>
  );
}

export function ProjectResourcesTab({
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
  resources,
}: {
  isArchived: boolean;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  meta?: Meta;
  onAdd: () => void;
  onDeleted: () => void;
  onEdit: (resource: ProjectResource) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  projectId: string;
  resources?: ProjectResource[];
}) {
  return (
    <ProjectDetailSectionFrame
      action={
        <Button disabled={isArchived} onClick={onAdd} type="button">
          <Plus data-icon="inline-start" />
          New resource
        </Button>
      }
      description="Useful links and references to continue your work."
      title="Resources"
    >
      <ResourcesSection
        isArchived={isArchived}
        isError={isError}
        isFetching={isFetching}
        meta={meta}
        isPending={isPending}
        onRetry={onRetry}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleted={onDeleted}
        projectId={projectId}
        resources={resources}
      />
    </ProjectDetailSectionFrame>
  );
}
