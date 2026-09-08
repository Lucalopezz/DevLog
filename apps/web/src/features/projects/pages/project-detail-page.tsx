import { FolderKanban, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState, type ReactNode } from "react";
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

type ProjectDetailTab = "overview" | "entries" | "commands" | "resources";

const tabs: { id: ProjectDetailTab; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "entries", label: "Entradas técnicas" },
  { id: "commands", label: "Comandos" },
  { id: "resources", label: "Recursos" },
];

export default function ProjectDetailPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  // A aba é estado de interface, enquanto os dados continuam no React Query.
  // Separar as responsabilidades evita refazer a consulta apenas porque o
  // usuário alternou entre Visão geral, Entradas, Comandos e Recursos.
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("overview");
  const [entriesPage, setEntriesPage] = useState(1);
  const [commandsPage, setCommandsPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);

  // Cada hook representa uma coleção independente da API. As páginas também
  // são independentes: avançar em comandos não altera a página de recursos.
  const projectQuery = useGetProject(projectId);
  const technicalEntriesQuery = useProjectTechnicalEntries(projectId, entriesPage);
  const commandsQuery = useProjectCommands(projectId, commandsPage);
  const resourcesQuery = useProjectResources(projectId, resourcesPage);

  // O projeto é o recurso pai. Por isso mostramos primeiro seu skeleton e só
  // renderizamos as seções quando já existe um projeto para contextualizá-las.
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
            <h1 className="text-xl font-semibold" id="project-detail-error-title">
              Projeto não encontrado
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              O projeto pode ter sido removido ou não pertence à sua conta.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/projects">Voltar para projetos</Link>
          </Button>
        </section>
      </main>
    );
  }

  const project = projectQuery.data;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8">
      <ProjectDetailHeader
        onEdit={() => setIsEditProjectDialogOpen(true)}
        project={project}
      />
      <ProjectEditForm
        key={`${project.id}:${project.updatedAt}`}
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
        project={project}
      />

      {/* Os papéis ARIA tornam a navegação compreensível para leitores de tela;
          o foco visível mantém a mesma affordance para teclado e mouse. */}
      <nav aria-label="Seções do projeto" className="overflow-x-auto border-b border-border/60">
        <div className="flex min-w-max gap-1" role="tablist">
          {tabs.map((tab) => {
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
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section
        aria-labelledby={`project-tab-${activeTab}`}
        id={`project-panel-${activeTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        <h2 className="sr-only" id={`project-tab-${activeTab}`}>
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h2>

        {activeTab === "overview" ? (
          <ProjectDetailOverview
            commandsTotal={commandsQuery.data?.meta.total}
            project={project}
            resourcesTotal={resourcesQuery.data?.meta.total}
            technicalEntriesTotal={technicalEntriesQuery.data?.meta.total}
          />
        ) : null}

        {activeTab === "entries" ? (
          <SectionFrame
            description="Problemas e aprendizados ligados ao contexto deste projeto."
            title="Entradas técnicas"
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

        {activeTab === "commands" ? (
          <SectionFrame
            description="Comandos recorrentes para configurar, executar e manter o projeto."
            title="Comandos"
          >
            <CommandsSection
              commands={commandsQuery.data?.data}
              isError={commandsQuery.isError}
              isFetching={commandsQuery.isFetching}
              meta={commandsQuery.data?.meta}
              isPending={commandsQuery.isPending}
              onRetry={() => commandsQuery.refetch()}
              onPageChange={setCommandsPage}
            />
          </SectionFrame>
        ) : null}

        {activeTab === "resources" ? (
          <SectionFrame
            description="Links e referências importantes para continuar o trabalho."
            title="Recursos"
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
      </section>

      {projectQuery.isFetching ? (
        <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Atualizando projeto...
        </p>
      ) : null}
    </main>
  );
}

function SectionFrame({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}
