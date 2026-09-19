import { Check, ChevronDown, Loader2, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTags } from "../hooks/use-tags";
import type { Tag } from "../types/tag";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

type TagOption = Pick<Tag, "id" | "name">;

type TagSearchSelectProps = {
  value?: TagOption;
  onChange: (tag: TagOption | undefined) => void;
};

/**
 * A single-value, server-backed tag combobox.
 *
 * The component deliberately does not query tags while the dropdown is empty.
 * The API receives only the debounced text, so the browser never needs to
 * download the complete tag library just to render a filter.
 */
export function TagSearchSelect({
  onChange,
  value,
}: TagSearchSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listboxId = `${inputId}-options`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const canSearch = debouncedSearchTerm.length >= MIN_SEARCH_LENGTH;
  const currentSearchTerm = searchTerm.trim();
  const isWaitingForDebounce =
    currentSearchTerm.length >= MIN_SEARCH_LENGTH &&
    currentSearchTerm !== debouncedSearchTerm;
  const { data, isError, isFetching } = useTags(
    {
      page: 1,
      perPage: 10,
      sort: "name",
      sortDir: "asc",
      name: debouncedSearchTerm,
    },
    { enabled: isOpen && canSearch && !isWaitingForDebounce },
  );

  function handleOpen() {
    setIsOpen(true);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }

  function handleClear(event?: MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    onChange(undefined);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }

  function handleSelect(tag: TagOption) {
    // The filter only needs the stable identity and display label. Keeping the
    // selection small avoids coupling this UI state to the tag API payload.
    onChange({ id: tag.id, name: tag.name });
    setIsOpen(false);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const firstResult = data?.data[0];
      if (firstResult) handleSelect(firstResult);
    }
  }

  return (
    <div className="relative flex min-w-48 flex-col gap-2" ref={rootRef}>
      <label className="text-sm font-medium" htmlFor={`${inputId}-trigger`}>
        Tag
      </label>
      {/* Anchor the clear action to the control, not the label's full field. */}
      <div className="relative">
        <Button
          aria-label={value ? `Selected tag: ${value.name}` : "All tags"}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="h-8 w-full justify-between px-2.5 font-normal"
          id={`${inputId}-trigger`}
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          type="button"
          variant="outline"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? `#${value.name}` : "All tags"}
          </span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>

        {value ? (
          <button
            aria-label="Clear tag filter"
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={handleClear}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className="absolute top-full z-50 mt-1 w-full min-w-64 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md"
          id={listboxId}
          role="listbox"
        >
          <Input
            aria-controls={listboxId}
            aria-label="Search tags"
            aria-autocomplete="list"
            autoFocus
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type at least 2 characters"
            role="combobox"
            value={searchTerm}
          />

          <div className="mt-2 max-h-56 overflow-y-auto">
            {!canSearch ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Type at least {MIN_SEARCH_LENGTH} characters to search tags.
              </p>
            ) : null}

            {canSearch && (isWaitingForDebounce || isFetching) ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 px-2 py-4 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Searching tags...
              </p>
            ) : null}

            {canSearch && !isWaitingForDebounce && !isFetching && isError ? (
              <p className="px-2 py-4 text-sm text-destructive">
                Could not search tags. Try again.
              </p>
            ) : null}

            {canSearch &&
            !isWaitingForDebounce &&
            !isFetching &&
            !isError &&
            data?.data.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                No tags found.
              </p>
            ) : null}

            {canSearch &&
            !isWaitingForDebounce &&
            !isFetching &&
            !isError &&
            data?.data.length ? (
              <ul>
                {data.data.map((tag) => (
                  <li key={tag.id}>
                    <button
                      aria-selected={value?.id === tag.id}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      onClick={() => handleSelect(tag)}
                      role="option"
                      type="button"
                    >
                      <span>#{tag.name}</span>
                      {value?.id === tag.id ? <Check className="size-4" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
