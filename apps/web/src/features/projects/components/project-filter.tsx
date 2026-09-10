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
  // These values are the "draft". They change as the user types,
  // but do not yet change the API query.
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<ProjectStatus | "">(initialStatus ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The query runs only when the user clicks Search.
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
          Name
        </label>

        <Input
          id="project-name-filter"
          onChange={(event) => setName(event.target.value)}
          placeholder="Search by name"
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
            // The select returns a string. The type guard restricts it to the
            // enum accepted by the backend and represents "All" with an empty value.
            const nextStatus = event.target.value;
            setStatus(isProjectStatus(nextStatus) ? nextStatus : "");
          }}
          value={status}
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="FINISHED">Finished</option>
        </select>
      </div>
    </SearchForm>
  );
}
