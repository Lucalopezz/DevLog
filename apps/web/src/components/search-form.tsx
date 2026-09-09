import type { FormEventHandler, ReactNode } from "react";

import { Button } from "@/components/ui/button";

type SearchFormProps = {
  children: ReactNode;
  onClear: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

/**
 * Shared visual structure for search forms.
 *
 * This component has no knowledge of Project, Tag, or any other domain. It
 * only arranges the fields received through `children` and standardizes the
 * search and clear actions. Each feature remains responsible for interpreting its
 * own values and building the API parameters.
 */
export function SearchForm({ children, onClear, onSubmit }: SearchFormProps) {
  return (
    <form
      aria-label="Search filters"
      className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-end"
      onSubmit={onSubmit}
    >
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
        {children}
      </div>

      <div className="flex gap-2">
        <Button onClick={onClear} type="button" variant="outline">
          Clear
        </Button>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}
