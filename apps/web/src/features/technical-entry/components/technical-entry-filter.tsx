import { useState, type FormEvent } from "react";
import { SearchForm } from "@/components/search-form";
import { Input } from "@/components/ui/input";
import type {
  TechnicalEntrySearchFormValues,
  TechnicalEntryStatus,
  TechnicalEntryType,
} from "../types/technical-entry";

type TechnicalEntryFiltersProps = {
  initialTitle: string;
  initialType?: TechnicalEntryType;
  initialStatus?: TechnicalEntryStatus;
  onSearch: (filters: TechnicalEntrySearchFormValues) => void;
  onClear: () => void;
};

export function TechnicalEntryFilters({
  initialTitle,
  initialType,
  initialStatus,
  onSearch,
  onClear,
}: TechnicalEntryFiltersProps) {
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState<TechnicalEntryType | "">(initialType ?? "");
  const [status, setStatus] = useState<TechnicalEntryStatus | "">(
    initialStatus ?? "",
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({ title, type, status });
  }

  function handleClear() {
    setTitle("");
    setType("");
    setStatus("");
    onClear();
  }

  return (
    <SearchForm onClear={handleClear} onSubmit={handleSubmit}>
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium" htmlFor="technical-entry-title-filter">
          Title
        </label>
        <Input
          id="technical-entry-title-filter"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Search by title"
          value={title}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="technical-entry-type-filter">
          Type
        </label>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          id="technical-entry-type-filter"
          onChange={(event) => {
            const nextType = event.target.value as TechnicalEntryType | "";
            setType(nextType);

            // The API rejects a status together with LEARNING because only
            // ISSUE entries have an open/resolved lifecycle.
            if (nextType === "LEARNING") setStatus("");
          }}
          value={type}
        >
          <option value="">All types</option>
          <option value="ISSUE">Issues</option>
          <option value="LEARNING">Learnings</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="technical-entry-status-filter">
          Status
        </label>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={type === "LEARNING"}
          id="technical-entry-status-filter"
          onChange={(event) =>
            setStatus(event.target.value as TechnicalEntryStatus | "")
          }
          value={status}
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>
    </SearchForm>
  );
}
