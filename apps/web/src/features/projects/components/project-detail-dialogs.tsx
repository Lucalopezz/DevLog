import { ProjectCommandForm } from "./project-command-form";
import { ProjectEditForm } from "./project-edit-form";
import { ProjectResourceForm } from "./project-resource-form";
import { TechnicalEntryForm } from "@/features/technical-entry/components/technical-entry-form";
import type { ProjectCommand, ProjectResource } from "../types/project-detail";
import type { Project } from "../types/project";

export function ProjectDetailDialogs({
  command,
  isCommandOpen,
  isCreateEntryOpen,
  isEditProjectOpen,
  isResourceOpen,
  onCommandChange,
  onCommandOpenChange,
  onCommandSaved,
  onCreateEntryOpenChange,
  onEditProjectOpenChange,
  onResourceChange,
  onResourceOpenChange,
  onResourceSaved,
  project,
  resource,
}: {
  command?: ProjectCommand;
  isCommandOpen: boolean;
  isCreateEntryOpen: boolean;
  isEditProjectOpen: boolean;
  isResourceOpen: boolean;
  onCommandChange: (command?: ProjectCommand) => void;
  onCommandOpenChange: (open: boolean) => void;
  onCommandSaved: (wasCreated: boolean) => void;
  onCreateEntryOpenChange: (open: boolean) => void;
  onEditProjectOpenChange: (open: boolean) => void;
  onResourceChange: (resource?: ProjectResource) => void;
  onResourceOpenChange: (open: boolean) => void;
  onResourceSaved: (wasCreated: boolean) => void;
  project: Project;
  resource?: ProjectResource;
}) {
  return (
    <>
      <ProjectEditForm
        key={`${project.id}:${project.updatedAt}`}
        open={isEditProjectOpen}
        onOpenChange={onEditProjectOpenChange}
        project={project}
      />
      <TechnicalEntryForm
        open={isCreateEntryOpen}
        onOpenChange={onCreateEntryOpenChange}
        projectId={project.id}
      />
      <ProjectCommandForm
        command={command}
        onOpenChange={(open) => {
          onCommandOpenChange(open);
          if (!open) onCommandChange(undefined);
        }}
        onSaved={onCommandSaved}
        open={isCommandOpen}
        projectId={project.id}
      />
      <ProjectResourceForm
        onOpenChange={(open) => {
          onResourceOpenChange(open);
          if (!open) onResourceChange(undefined);
        }}
        onSaved={onResourceSaved}
        open={isResourceOpen}
        projectId={project.id}
        resource={resource}
      />
    </>
  );
}
