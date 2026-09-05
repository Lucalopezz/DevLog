import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProjectPagination({
  isFetching,
  meta,
  onPageChange,
}: {
  isFetching: boolean;
  meta: Meta;
  onPageChange: (page: number) => void;
}) {
  const isFirstPage = meta.currentPage <= 1;
  const isLastPage = meta.currentPage >= meta.lastPage;

  return (
    <nav
      aria-label="Paginação de projetos"
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Página {meta.currentPage} de {meta.lastPage} ·{' '}
        {meta.total.toLocaleString('pt-BR')} projeto(s)
      </p>

      <div className="flex items-center gap-2">
        <Button
          aria-label="Ir para a página anterior"
          disabled={isFirstPage || isFetching}
          onClick={() => onPageChange(meta.currentPage - 1)}
          type="button"
          variant="outline"
        >
          <ChevronLeft data-icon="inline-start" />
          Anterior
        </Button>
        <Button
          aria-label="Ir para a próxima página"
          disabled={isLastPage || isFetching}
          onClick={() => onPageChange(meta.currentPage + 1)}
          type="button"
          variant="outline"
        >
          Próxima
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}

