import { FolderKanban, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetProject } from "../hooks/use-get-project";
import {
  useProjectCommands,
  useProjectResources,
  useProjectTechnicalEntries,
} from "../hooks/use-project-details";
import { ProjectDetailHeader } from "../components/project-detail-header";
import { ProjectDetailOverview } from "../components/project-detail-overview";
import { ProjectDetailSkeleton } from "../components/project-detail-skeleton";
import { ProjectSettingsPane } from "../components/project-settings-pane";
import { ProjectDetailDialogs } from "../components/project-detail-dialogs";
import {
  ProjectCommandsTab,
  ProjectEntriesTab,
  ProjectResourcesTab,
  ProjectTechnologiesTab,
} from "../components/project-detail-tab-content";
import {
  ProjectDetailTabPanel,
  ProjectDetailTabs,
  type ProjectDetailTab,
} from "../components/project-detail-tabs";
import type { ProjectCommand, ProjectResource } from "../types/project-detail";

export default function ProjectDetailPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  // This page coordinates route data and interface state; tab and section
  // components own the markup and interactions for each visible area.
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("overview");
  const [entriesPage, setEntriesPage] = useState(1);
  const [commandsPage, setCommandsPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isCreateEntryDialogOpen, setIsCreateEntryDialogOpen] = useState(false);
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<ProjectCommand>();
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ProjectResource>();

  // Collection requests and pagination are independent so one tab's actions
  // cannot accidentally change another tab's cached page.
  const projectQuery = useGetProject(projectId);
  const technicalEntriesQuery = useProjectTechnicalEntries(
    projectId,
    entriesPage,
  );
  const commandsQuery = useProjectCommands(projectId, commandsPage);
  const resourcesQuery = useProjectResources(projectId, resourcesPage);

  if (projectQuery.isPending) return <ProjectDetailSkeleton />;

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center justify-center">
        <section
          aria-labelledby="project-detail-error-title"
          className="w-full space-y-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center"
          role="alert"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <FolderKanban className="size-6" />
          </div>
          <div className="space-y-2">
            <h1
              className="text-xl font-semibold"
              id="project-detail-error-title"
            >
              Project not found
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              The project may have been removed or may not belong to your
              account.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/projects">Back to projects</Link>
          </Button>
        </section>
      </main>
    );
  }

  const project = projectQuery.data;
  const isArchived = Boolean(project.archivedAt);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8">
      <ProjectDetailHeader project={project} />

      <ProjectDetailDialogs
        command={editingCommand}
        isCommandOpen={isCommandDialogOpen}
        isCreateEntryOpen={isCreateEntryDialogOpen}
        isEditProjectOpen={isEditProjectDialogOpen}
        isResourceOpen={isResourceDialogOpen}
        onCommandChange={setEditingCommand}
        onCommandOpenChange={setIsCommandDialogOpen}
        onCommandSaved={(wasCreated) => {
          if (wasCreated) setCommandsPage(1);
        }}
        onCreateEntryOpenChange={setIsCreateEntryDialogOpen}
        onEditProjectOpenChange={setIsEditProjectDialogOpen}
        onResourceChange={setEditingResource}
        onResourceOpenChange={setIsResourceDialogOpen}
        onResourceSaved={(wasCreated) => {
          if (wasCreated) setResourcesPage(1);
        }}
        project={project}
        resource={editingResource}
      />

      <ProjectDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <ProjectDetailTabPanel activeTab={activeTab} id="overview">
        <ProjectDetailOverview
          commandsTotal={commandsQuery.data?.meta.total}
          project={project}
          resourcesTotal={resourcesQuery.data?.meta.total}
          technicalEntriesTotal={technicalEntriesQuery.data?.meta.total}
        />
      </ProjectDetailTabPanel>

      <ProjectDetailTabPanel activeTab={activeTab} id="entries">
        <ProjectEntriesTab
          entries={technicalEntriesQuery.data?.data}
          isArchived={isArchived}
          isError={technicalEntriesQuery.isError}
          isFetching={technicalEntriesQuery.isFetching}
          isPending={technicalEntriesQuery.isPending}
          meta={technicalEntriesQuery.data?.meta}
          onCreate={() => setIsCreateEntryDialogOpen(true)}
          onPageChange={setEntriesPage}
          onRetry={() => technicalEntriesQuery.refetch()}
        />
      </ProjectDetailTabPanel>

      <ProjectDetailTabPanel activeTab={activeTab} id="technologies">
        <ProjectTechnologiesTab
          isArchived={isArchived}
          projectId={project.id}
          technologies={project.technologies ?? []}
        />
      </ProjectDetailTabPanel>

      <ProjectDetailTabPanel activeTab={activeTab} id="commands">
        <ProjectCommandsTab
          commands={commandsQuery.data?.data}
          isArchived={isArchived}
          isError={commandsQuery.isError}
          isFetching={commandsQuery.isFetching}
          isPending={commandsQuery.isPending}
          meta={commandsQuery.data?.meta}
          onAdd={() => {
            setEditingCommand(undefined);
            setIsCommandDialogOpen(true);
          }}
          onDeleted={() => {
            if (commandsQuery.data?.data.length === 1 && commandsPage > 1) {
              setCommandsPage(commandsPage - 1);
            }
          }}
          onEdit={(command) => {
            setEditingCommand(command);
            setIsCommandDialogOpen(true);
          }}
          onPageChange={setCommandsPage}
          onRetry={() => commandsQuery.refetch()}
          projectId={project.id}
        />
      </ProjectDetailTabPanel>

      <ProjectDetailTabPanel activeTab={activeTab} id="resources">
        <ProjectResourcesTab
          isArchived={isArchived}
          isError={resourcesQuery.isError}
          isFetching={resourcesQuery.isFetching}
          isPending={resourcesQuery.isPending}
          meta={resourcesQuery.data?.meta}
          onAdd={() => {
            setEditingResource(undefined);
            setIsResourceDialogOpen(true);
          }}
          onDeleted={() => {
            if (resourcesQuery.data?.data.length === 1 && resourcesPage > 1) {
              setResourcesPage(resourcesPage - 1);
            }
          }}
          onEdit={(resource) => {
            setEditingResource(resource);
            setIsResourceDialogOpen(true);
          }}
          onPageChange={setResourcesPage}
          onRetry={() => resourcesQuery.refetch()}
          projectId={project.id}
          resources={resourcesQuery.data?.data}
        />
      </ProjectDetailTabPanel>

      <ProjectDetailTabPanel activeTab={activeTab} id="settings">
        <ProjectSettingsPane
          project={project}
          onEdit={() => setIsEditProjectDialogOpen(true)}
        />
      </ProjectDetailTabPanel>

      {projectQuery.isFetching ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="size-4 animate-spin" />
          Updating project...
        </p>
      ) : null}
    </main>
  );
}
