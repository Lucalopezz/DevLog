import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { SearchForm } from "@/components/search-form";

type TagFilterProps = {
  initialName: string;
  onSearch: (name: string) => void;
  onClear: () => void;
};

export function TagFilter({
  initialName,
  onClear,
  onSearch,
}: TagFilterProps) {
  const [name, setName] = useState(initialName);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The input is a draft until submission; the page owns the applied value
    // in the URL and is responsible for triggering the API query.
    onSearch(name);
  }

  function handleClear() {
    setName("");
    onClear();
  }

  return (
    <SearchForm onClear={handleClear} onSubmit={handleSubmit}>
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium" htmlFor="tag-name-filter">
          Name
        </label>
        <Input
          autoComplete="off"
          id="tag-name-filter"
          onChange={(event) => setName(event.target.value)}
          placeholder="Search by name"
          value={name}
        />
      </div>
    </SearchForm>
  );
}
