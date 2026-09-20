import { FolderKanban, Plus, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useGetProject } from "../hooks/use-get-project";
import {
  useProjectCommands,
  useProjectResources,
  useProjectTechnicalEntries,
} from "../hooks/use-project-details";
import { ProjectDetailHeader } from "../components/project-detail-header";
import { ProjectEditForm } from "../components/project-edit-form";
import { ProjectDetailOverview } from "../components/project-detail-overview";
import { ProjectDetailSkeleton } from "../components/project-detail-skeleton";
import {
  CommandsSection,
  ResourcesSection,
  TechnicalEntriesSection,
} from "../components/project-detail-sections";
import { ProjectSettingsPane } from "../components/project-settings-pane";
import { TechnicalEntryForm } from "@/features/technical-entry/components/technical-entry-form";
import { ProjectTechnologiesSection } from "@/features/technologies/components/project-technologies-section";
import { ProjectCommandForm } from "../components/project-command-form";
import type { ProjectCommand } from "../types/project-detail";

type ProjectDetailTab =
  | "overview"
  | "entries"
  | "technologies"
  | "commands"
  | "resources"
  | "settings";

const tabs: { id: ProjectDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "entries", label: "Technical entries" },
  { id: "technologies", label: "Technologies" },
  { id: "commands", label: "Commands" },
  { id: "resources", label: "Resources" },
  { id: "settings", label: "Settings" },
];

export default function ProjectDetailPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  // The tab is interface state, while data stays in React Query.
  // Separating responsibilities avoids refetching just because the
  // user switched between Overview, Entries, Commands, and Resources.
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("overview");
  const [entriesPage, setEntriesPage] = useState(1);
  const [commandsPage, setCommandsPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isCreateEntryDialogOpen, setIsCreateEntryDialogOpen] =
    useState(false);
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<ProjectCommand>();

  // Each hook represents an independent API collection. Pages are also
  // independent: advancing commands does not change the resource page.
  const projectQuery = useGetProject(projectId);
  const technicalEntriesQuery = useProjectTechnicalEntries(
    projectId,
    entriesPage,
  );
  const commandsQuery = useProjectCommands(projectId, commandsPage);
  const resourcesQuery = useProjectResources(projectId, resourcesPage);

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    // Automatic activation fits these tabs: all collections already query in
    // parallel, so moving focus does not start a new request or wait for data.
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    const tabButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabButtons?.[nextIndex]?.focus();
  }

  // The project is the parent resource. Show its skeleton first and only
  // render the sections once a project is available to provide context.
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

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8">
      <ProjectDetailHeader project={project} />
      <ProjectEditForm
        key={`${project.id}:${project.updatedAt}`}
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
        project={project}
      />
      <TechnicalEntryForm
        open={isCreateEntryDialogOpen}
        onOpenChange={setIsCreateEntryDialogOpen}
        projectId={project.id}
      />
      <ProjectCommandForm
        command={editingCommand}
        onOpenChange={(open) => {
          setIsCommandDialogOpen(open);
          if (!open) setEditingCommand(undefined);
        }}
        onSaved={(wasCreated) => {
          if (wasCreated) setCommandsPage(1);
        }}
        open={isCommandDialogOpen}
        projectId={project.id}
      />

      {/* ARIA roles make navigation understandable to screen readers;
          visible focus provides equivalent cues for keyboard and mouse users. */}
      <nav
        aria-label="Project sections"
        className="overflow-x-auto border-b border-border/60"
      >
        <div className="flex min-w-max gap-1" role="tablist">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                aria-controls={`project-panel-${tab.id}`}
                aria-selected={isActive}
                className={`relative rounded-t-lg px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  isActive
                    ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
                id={`project-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {tabs.map((tab) => (
        <section
          aria-labelledby={`project-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          id={`project-panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
          tabIndex={0}
        >
        {activeTab === tab.id && tab.id === "overview" ? (
          <ProjectDetailOverview
            commandsTotal={commandsQuery.data?.meta.total}
            project={project}
            resourcesTotal={resourcesQuery.data?.meta.total}
            technicalEntriesTotal={technicalEntriesQuery.data?.meta.total}
          />
        ) : null}

        {activeTab === tab.id && tab.id === "entries" ? (
          <SectionFrame
            action={
              <Button
                disabled={Boolean(project.archivedAt)}
                onClick={() => setIsCreateEntryDialogOpen(true)}
                type="button"
              >
                <Plus data-icon="inline-start" />
                New entry
              </Button>
            }
            description="Issues and lessons learned in the context of this project."
            title="Technical entries"
          >
            <TechnicalEntriesSection
              entries={technicalEntriesQuery.data?.data}
              isError={technicalEntriesQuery.isError}
              isFetching={technicalEntriesQuery.isFetching}
              meta={technicalEntriesQuery.data?.meta}
              isPending={technicalEntriesQuery.isPending}
              onRetry={() => technicalEntriesQuery.refetch()}
              onPageChange={setEntriesPage}
            />
          </SectionFrame>
        ) : null}

        {activeTab === tab.id && tab.id === "technologies" ? (
          <SectionFrame
            description="Languages, frameworks, databases, and tools used by this project."
            title="Technologies"
          >
            <ProjectTechnologiesSection
              isArchived={Boolean(project.archivedAt)}
              projectId={project.id}
              technologies={project.technologies ?? []}
            />
          </SectionFrame>
        ) : null}

        {activeTab === tab.id && tab.id === "commands" ? (
          <SectionFrame
            action={
              <Button
                disabled={Boolean(project.archivedAt)}
                onClick={() => {
                  setEditingCommand(undefined);
                  setIsCommandDialogOpen(true);
                }}
                type="button"
              >
                <Plus data-icon="inline-start" />
                New command
              </Button>
            }
            description="Recurring commands to set up, run, and maintain the project."
            title="Commands"
          >
            <CommandsSection
              commands={commandsQuery.data?.data}
              isArchived={Boolean(project.archivedAt)}
              isError={commandsQuery.isError}
              isFetching={commandsQuery.isFetching}
              meta={commandsQuery.data?.meta}
              isPending={commandsQuery.isPending}
              onDeleted={() => {
                if (commandsQuery.data?.data.length === 1 && commandsPage > 1) {
                  setCommandsPage(commandsPage - 1);
                }
              }}
              onEdit={(command) => {
                setEditingCommand(command);
                setIsCommandDialogOpen(true);
              }}
              onRetry={() => commandsQuery.refetch()}
              onPageChange={setCommandsPage}
              projectId={project.id}
            />
          </SectionFrame>
        ) : null}

        {activeTab === tab.id && tab.id === "resources" ? (
          <SectionFrame
            description="Useful links and references to continue your work."
            title="Resources"
          >
            <ResourcesSection
              isError={resourcesQuery.isError}
              isFetching={resourcesQuery.isFetching}
              meta={resourcesQuery.data?.meta}
              isPending={resourcesQuery.isPending}
              onRetry={() => resourcesQuery.refetch()}
              onPageChange={setResourcesPage}
              resources={resourcesQuery.data?.data}
            />
          </SectionFrame>
        ) : null}
        {activeTab === tab.id && tab.id === "settings" ? (
          <ProjectSettingsPane
            project={project}
            onEdit={() => setIsEditProjectDialogOpen(true)}
          />
        ) : null}
        </section>
      ))}

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

function SectionFrame({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
