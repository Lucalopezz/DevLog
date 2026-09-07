import { FolderKanban, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "../hooks/use-projects";
import { ProjectList } from "../components/project-list";
import { ProjectFilters } from "../components/project-filter";
import type {
  ListProjectsParams,
  ProjectSearchFormValues,
} from "../types/project";
import { isProjectStatus } from "../types/project";
import { ProjectPagination } from "../components/project-list-pagination";
import { ProjectListSkeleton } from "../components/project-list-skeleton";
import { ProjectForm } from "../components/project-form";

const defaultProjectParams = {
  perPage: 10,
  archivedAt: "null",
  sort: "createdAt",
  sortDir: "desc",
} satisfies Omit<ListProjectsParams, "page">;

function parsePage(value: string | null) {
  const page = Number(value);

  // A URL pode ser editada manualmente. Nunca enviamos NaN, zero ou número
  // decimal para a API, que espera uma página inteira maior que zero.
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // A URL representa os filtros já aplicados. O formulário mantém um rascunho
  // separado e só altera estes valores depois do submit.
  const page = parsePage(searchParams.get("page"));
  const name = searchParams.get("name")?.trim() || undefined;
  const rawStatus = searchParams.get("status");
  const status = isProjectStatus(rawStatus) ? rawStatus : undefined;

  const params = {
    ...defaultProjectParams,
    page,
    ...(name ? { name } : {}),
    ...(status ? { status } : {}),
  } satisfies ListProjectsParams;

  const { data, isError, isFetching, isPending, refetch } = useProjects(params);

  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);

  function handleSearch(filters: ProjectSearchFormValues) {
    const nextParams = new URLSearchParams(searchParams);

    // Removemos os valores anteriores para que uma busca vazia não deixe
    // parâmetros antigos escondidos na URL.
    nextParams.delete("name");
    nextParams.delete("status");

    // Uma mudança de filtro sempre começa na primeira página. Caso contrário,
    // uma busca nova poderia tentar abrir a página 4 e aparentar estar vazia.
    nextParams.set("page", "1");

    const normalizedName = filters.name.trim();

    if (normalizedName) {
      nextParams.set("name", normalizedName);
    }

    // "Todos" é representado por ausência de status. "ALL" não existe no
    // enum do backend e não deve ser enviado como se fosse um status válido.
    if (filters.status) {
      nextParams.set("status", filters.status);
    }

    setSearchParams(nextParams);
  }

  function handleClearFilters() {
    // Sem parâmetros, a página volta aos defaults: página 1, projetos não
    // arquivados, ordenação por criação e sem filtros de texto/status.
    setSearchParams({});
  }

  function handlePageChange(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);

    // Como começamos com a URL atual, name e status são preservados ao trocar
    // de página. A paginação continua sendo parte da mesma busca.
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

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

      <ProjectFilters
        // Quando os filtros aplicados mudam pela URL, o `key` cria um novo
        // rascunho com os valores da URL. Enquanto o usuário apenas digita,
        // a URL não muda e o formulário não é remontado.
        key={`${name ?? ""}:${status ?? ""}`}
        initialName={name ?? ""}
        initialStatus={status}
        onClear={handleClearFilters}
        onSearch={handleSearch}
      />

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
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </main>
  );
}
