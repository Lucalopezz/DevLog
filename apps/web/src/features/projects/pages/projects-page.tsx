import { FolderKanban, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "../hooks/use-projects";
import { ProjectList } from "../components/project-list";
import type { ListProjectsParams } from "../types/project";
import { ProjectPagination } from "../components/project-list-pagination";
import { ProjectListSkeleton } from "../components/project-list-skeleton";
import { ProjectForm } from "../components/project-form";

const defaultProjectParams = {
  perPage: 10,
  archivedAt: "null",
  sort: "createdAt",
  sortDir: "desc",
} satisfies Omit<ListProjectsParams, "page">;

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const params = { ...defaultProjectParams, page };
  const { data, isError, isFetching, isPending, refetch } = useProjects(params);

  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FolderKanban className="size-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Projetos</h1>
          </div>
          <p className="text-muted-foreground">
            Consulte os projetos associados à sua conta.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateProjectDialogOpen(true)}
        >
          Novo projeto
        </Button>

        {isFetching && !isPending ? (
          <p
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <RefreshCw className="size-4 animate-spin" />
            Atualizando...
          </p>
        ) : null}
      </header>

      <ProjectForm
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
      />

      {isPending ? <ProjectListSkeleton /> : null}

      {isError ? (
        <section
          aria-labelledby="projects-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <div className="space-y-1">
            <h2 className="font-semibold" id="projects-error-title">
              Não foi possível carregar os projetos
            </h2>
            <p className="text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button onClick={() => refetch()} type="button" variant="outline">
            Tentar novamente
          </Button>
        </section>
      ) : null}

      {!isPending && !isError && data?.data.length === 0 ? (
        <section className="space-y-2 rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">Nenhum projeto encontrado</h2>
          <p className="text-sm text-muted-foreground">
            Você ainda não possui projetos não arquivados.
          </p>
        </section>
      ) : null}

      {!isPending && !isError && data && data.data.length > 0 ? (
        <>
          <ProjectList projects={data.data} />
          <ProjectPagination
            isFetching={isFetching}
            meta={data.meta}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </main>
  );
}
