import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { SearchForm } from "@/components/search-form";
import type {
  ProjectSearchFormValues,
  ProjectStatus,
} from "../types/project";
import { isProjectStatus } from "../types/project";

type ProjectFiltersProps = {
  initialName: string;
  initialStatus?: ProjectStatus;
  onSearch: (filters: ProjectSearchFormValues) => void;
  onClear: () => void;
};

export function ProjectFilters({
  initialName,
  initialStatus,
  onSearch,
  onClear,
}: ProjectFiltersProps) {
  // Estes valores são o "rascunho". Eles mudam enquanto o usuário digita,
  // mas ainda não alteram a consulta da API.
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<ProjectStatus | "">(initialStatus ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A consulta só será executada quando o usuário clicar em Buscar.
    onSearch({ name, status });
  }

  function handleClear() {
    setName("");
    setStatus("");
    onClear();
  }

  return (
    <SearchForm onClear={handleClear} onSubmit={handleSubmit}>
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium" htmlFor="project-name-filter">
          Nome
        </label>

        <Input
          id="project-name-filter"
          onChange={(event) => setName(event.target.value)}
          placeholder="Pesquisar por nome"
          value={name}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="project-status-filter">
          Status
        </label>

        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          id="project-status-filter"
          onChange={(event) => {
            // O select entrega uma string. O type guard limita o valor ao
            // enum aceito pelo backend e representa "Todos" com vazio.
            const nextStatus = event.target.value;
            setStatus(isProjectStatus(nextStatus) ? nextStatus : "");
          }}
          value={status}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
          <option value="FINISHED">Finalizados</option>
        </select>
      </div>
    </SearchForm>
  );
}
