import type { FormEventHandler, ReactNode } from "react";

import { Button } from "@/components/ui/button";

type SearchFormProps = {
  children: ReactNode;
  onClear: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

/**
 * Estrutura visual compartilhada por formulários de busca.
 *
 * Este componente não conhece Project, Tag ou qualquer outro domínio. Ele
 * apenas organiza os campos recebidos por `children` e padroniza as ações de
 * buscar e limpar. Cada feature continua responsável por interpretar seus
 * próprios valores e montar os parâmetros da API.
 */
export function SearchForm({ children, onClear, onSubmit }: SearchFormProps) {
  return (
    <form
      aria-label="Filtros de busca"
      className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-end"
      onSubmit={onSubmit}
    >
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
        {children}
      </div>

      <div className="flex gap-2">
        <Button onClick={onClear} type="button" variant="outline">
          Limpar
        </Button>
        <Button type="submit">Buscar</Button>
      </div>
    </form>
  );
}
