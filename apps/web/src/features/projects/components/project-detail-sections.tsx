import {
  CircleAlert,
  ExternalLink,
  Lightbulb,
  RefreshCw,
  Terminal,
} from "lucide-react";
import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/date";
import type { ProjectCommand, ProjectResource } from "../types/project-detail";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";
import { resourcePresentation } from "../presentation";

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar esta seção.
      </p>
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        <RefreshCw data-icon="inline-start" />
        Tentar novamente
      </Button>
    </div>
  );
}

function EmptySection({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function DetailPagination({
  isFetching,
  meta,
  onPageChange,
}: {
  isFetching: boolean;
  meta?: Meta;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.lastPage <= 1) return null;

  const isFirstPage = meta.currentPage <= 1;
  const isLastPage = meta.currentPage >= meta.lastPage;

  return (
    <nav
      aria-label="Paginação da seção"
      className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Página {meta.currentPage} de {meta.lastPage} ·{" "}
        {meta.total.toLocaleString("pt-BR")} item(ns)
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={isFirstPage || isFetching}
          onClick={() => onPageChange(meta.currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          disabled={isLastPage || isFetching}
          onClick={() => onPageChange(meta.currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Próxima
        </Button>
      </div>
    </nav>
  );
}

const technicalEntryTypePresentation = {
  ISSUE: { label: "Problema", icon: CircleAlert },
  LEARNING: { label: "Aprendizado", icon: Lightbulb },
} as const;

export function TechnicalEntriesSection({
  entries,
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
}: {
  entries?: TechnicalEntry[];
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  // A resposta pode estar pendente, vazia ou com erro. Tratar esses estados
  // aqui mantém a página focada em composição e permite retry por seção.
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!entries?.length) {
    return (
      <EmptySection>
        Nenhuma entrada técnica foi registrada neste projeto.
      </EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const type = technicalEntryTypePresentation[entry.type];
          const TypeIcon = type.icon;

          return (
            <article
              className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
              key={entry.id}
            >
              <header className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TypeIcon className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {type.label}
                    </p>
                    <h3 className="mt-1 break-words font-semibold">
                      {entry.title}
                    </h3>
                  </div>
                </div>
                {entry.status ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.status === "RESOLVED" ? "Resolvido" : "Em aberto"}
                  </span>
                ) : null}
              </header>

              <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                {entry.context}
              </p>

              {entry.tags?.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <li
                      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      key={tag.id}
                    >
                      #{tag.name}
                    </li>
                  ))}
                </ul>
              ) : null}

              <time
                className="mt-auto text-xs text-muted-foreground"
                dateTime={entry.updatedAt}
              >
                Atualizado {formatRelativeDate(entry.updatedAt)}
              </time>
            </article>
          );
        })}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export function CommandsSection({
  commands,
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
}: {
  commands?: ProjectCommand[];
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!commands?.length) {
    return (
      <EmptySection>Nenhum comando foi registrado neste projeto.</EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {commands.map((command, index) => (
          <article
            className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
            key={command.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Terminal className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {command.executionOrder ?? index + 1}. Comando
                  </p>
                  <h3 className="mt-1 break-words font-semibold">
                    {command.title}
                  </h3>
                </div>
              </div>
              <time
                className="text-xs text-muted-foreground"
                dateTime={command.updatedAt}
              >
                {formatRelativeDate(command.updatedAt)}
              </time>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground p-4 text-sm leading-6 text-background">
              <code>{command.command}</code>
            </pre>
            {command.description ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {command.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}
export function ResourcesSection({
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
  resources,
}: {
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  resources?: ProjectResource[];
}) {
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!resources?.length) {
    return (
      <EmptySection>Nenhum recurso foi registrado neste projeto.</EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => {
          const presentation = resourcePresentation[resource.type];
          const ResourceIcon = presentation.icon;
          const isExternal = /^https?:\/\//.test(resource.url);

          return (
            <a
              className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-card"
              href={resource.url}
              key={resource.id}
              rel={isExternal ? "noreferrer" : undefined}
              target={isExternal ? "_blank" : undefined}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ResourceIcon className="size-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {presentation.label}
                  <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-1 block truncate font-medium">
                  {resource.label}
                </span>
                <span
                  className="mt-1 block truncate font-mono text-xs text-muted-foreground"
                  title={resource.url}
                >
                  {resource.url}
                </span>
              </span>
            </a>
          );
        })}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function LoadingSection() {
  // aria-live/role=status comunica a mudança assíncrona sem depender de
  // animação visual, o que também ajuda usuários de tecnologias assistivas.
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center"
      role="status"
    >
      <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">
        Carregando conteúdo...
      </p>
    </div>
  );
}
