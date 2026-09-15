import { Check, Loader2, Plus, RefreshCw, Tags, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTags } from "../hooks/use-tags";
import type { Tag } from "../types/tag";
import { TagBadge } from "./tag-badge";
import { TagForm } from "./tag-form";

const tagSelectorParams = {
  page: 1,
  perPage: 100,
  sort: "name",
  sortDir: "asc",
} as const;

type TagSelectorProps = {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
};

/**
 * Selects tag IDs without knowing which resource will ultimately own them.
 *
 * The parent keeps the IDs as form or server state. This component owns only
 * the transient interface state: the picker dialog, its search text, and tags
 * created during the current interaction.
 */
export function TagSelector({
  value,
  onChange,
  disabled = false,
}: TagSelectorProps) {
  // Local UI state.
  // The selected tag IDs themselves are NOT stored here: they come from `value`,
  // so the parent component remains the source of truth.
  //
  // Example:
  // parent state:
  //   value = ["tag-1", "tag-3"]
  //
  // this component only controls temporary interface state such as:
  //   - whether dialogs are open
  //   - the current search text
  //   - temporary tag details needed to keep the UI consistent
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [selectedTagDetails, setSelectedTagDetails] = useState<Tag[]>([]);

  // `searchTerm` updates immediately when the user types.
  // `deferredSearchTerm` is allowed to update with lower priority, so typing
  // remains responsive while the tag query updates.
  //
  // Important: useDeferredValue is NOT a debounce.
  // It does not mean "wait 300ms after the user stops typing".
  //
  // Conceptually:
  //   searchTerm:         "r" -> "re" -> "rea" -> "react"
  //   deferredSearchTerm:           "re" -------> "react"
  //
  // React decides when the deferred value should catch up.
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  // Fetch tags from the server.
  //
  // When no search exists:
  // {
  //   page: 1,
  //   perPage: 100,
  //   sort: "name",
  //   sortDir: "asc"
  // }
  //
  // When the user searches "react":
  // {
  //   ...
  //   name: "react"
  // }
  const { data, isError, isFetching, isPending, refetch } = useTags({
    ...tagSelectorParams,
    ...(deferredSearchTerm ? { name: deferredSearchTerm } : {}),
  });

  // Build a lookup table containing every tag whose details are currently known.
  //
  // Why is this necessary?
  //
  // The API result may change whenever the user searches.
  //
  // Example:
  //   search "react"
  //   API returns:
  //     React
  //     React Query
  //
  // The user selects React.
  //
  // Then they search "docker":
  //   API now returns:
  //     Docker
  //     Docker Compose
  //
  // `value` still contains the React tag ID, but React is no longer in the
  // current API response. `selectedTagDetails` preserves the full React object
  // so the selected badge can still display "#React".
  //
  // `createdTags` serves a similar purpose for tags that were just created but
  // may not yet appear in the refreshed server query.
  //
  // A Map makes lookup by ID straightforward:
  //
  //   "tag-1" -> { id: "tag-1", name: "React" }
  //   "tag-2" -> { id: "tag-2", name: "Go" }
  //
  // `useMemo` means this Map is rebuilt only when one of its dependencies
  // changes, instead of being recreated on every unrelated render.
  const knownTagsById = useMemo(() => {
    return new Map(
      [...(data?.data ?? []), ...createdTags, ...selectedTagDetails].map(
        (tag) => [tag.id, tag],
      ),
    );
  }, [createdTags, data?.data, selectedTagDetails]);

  // Build the list displayed inside the picker.
  //
  // We merge:
  //   1. tags returned by the server
  //   2. tags created during the current interaction
  //
  // A Map removes duplicate IDs.
  //
  // Example:
  //
  // server:
  //   React (id: 1)
  //   Go    (id: 2)
  //
  // createdTags:
  //   Go     (id: 2)
  //   Docker (id: 3)
  //
  // resulting Map:
  //   1 -> React
  //   2 -> Go
  //   3 -> Docker
  //
  // We then apply the search filter locally as well. This matters because
  // `createdTags` is local state and may not yet be represented by the server
  // query result.
  const availableTags = useMemo(() => {
    const tagsById = new Map(
      [...(data?.data ?? []), ...createdTags].map((tag) => [tag.id, tag]),
    );

    return [...tagsById.values()].filter(
      (tag) =>
        !deferredSearchTerm ||
        tag.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()),
    );
  }, [createdTags, data?.data, deferredSearchTerm]);

  // `value` contains only IDs because the parent/form should store the minimal
  // selection state.
  //
  // Here we convert those IDs back into full Tag objects for rendering.
  //
  // Example:
  //
  // value:
  //   ["1", "3"]
  //
  // knownTagsById:
  //   "1" -> React
  //   "2" -> Go
  //   "3" -> Docker
  //
  // selectedTags:
  //   [React, Docker]
  //
  // flatMap is used so unknown IDs are simply skipped instead of producing:
  //
  //   [React, undefined, Docker]
  const selectedTags = value.flatMap((tagId) => {
    const tag = knownTagsById.get(tagId);
    return tag ? [tag] : [];
  });

  // It is possible for the parent to contain selected IDs whose full tag
  // details have not been loaded yet.
  //
  // Example:
  //
  // value.length = 3
  // selectedTags.length = 2
  //
  // One selected tag is known by ID but cannot be rendered yet.
  const unlistedSelectedCount = value.length - selectedTags.length;

  function toggleTag(tag: Tag) {
    const tagId = tag.id;

    // If the tag is already selected, remove its ID from the parent's value.
    //
    // Example:
    //   value = ["1", "2", "3"]
    //   clicked ID = "2"
    //
    // result:
    //   ["1", "3"]
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
      return;
    }

    // Preserve the complete tag object locally before selecting it.
    //
    // This allows the component to continue showing the tag's name even if a
    // future search causes the current API result to no longer contain it.
    //
    // The filter removes an older copy of the same tag before appending the
    // latest object, preventing duplicate entries.
    setSelectedTagDetails((currentTags) => [
      ...currentTags.filter((currentTag) => currentTag.id !== tagId),
      tag,
    ]);

    // The parent owns the actual selected IDs.
    //
    // Example:
    //   value = ["1", "3"]
    //   tagId = "2"
    //
    // result:
    //   ["1", "3", "2"]
    onChange([...value, tagId]);
  }

  function removeTag(tagId: string) {
    // Remove the selected ID from the parent's value.
    //
    // We do not maintain a second "selected IDs" state inside this component,
    // avoiding duplicated sources of truth.
    onChange(value.filter((id) => id !== tagId));
  }

  function handleTagCreated(tag: Tag) {
    // Keep a newly created tag locally.
    //
    // The POST request may succeed before the tags query has finished
    // invalidating/refetching. Without this local copy, the new tag could
    // temporarily disappear from the interface.
    //
    // Flow:
    //
    // create tag
    //   ↓
    // server responds successfully
    //   ↓
    // store tag in createdTags
    //   ↓
    // UI can display it immediately
    //   ↓
    // server query eventually refreshes
    setCreatedTags((currentTags) => [
      ...currentTags.filter((currentTag) => currentTag.id !== tag.id),
      tag,
    ]);

    // Also preserve the tag's details because the newly created tag is selected
    // immediately below.
    setSelectedTagDetails((currentTags) => [
      ...currentTags.filter((currentTag) => currentTag.id !== tag.id),
      tag,
    ]);

    // Reset the picker search so the newly created tag is not accidentally
    // hidden by the previous search term.
    setSearchTerm("");

    // Automatically select the new tag.
    //
    // Set prevents duplicate IDs in case the same tag somehow became selected
    // before this asynchronous creation handler finished.
    //
    // Example:
    //   value = ["1", "2"]
    //   tag.id = "3"
    //
    // result:
    //   ["1", "2", "3"]
    //
    // If "3" were already present, Set would still return only one "3".
    onChange([...new Set([...value, tag.id])]);
  }

  return (
    <section aria-labelledby="tag-selector-title" className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium" id="tag-selector-title">
          Tags
        </h3>
        <p className="text-sm text-muted-foreground">
          Classify this item with one or more reusable tags.
        </p>
      </div>

      {selectedTags.length > 0 ? (
        <ul aria-label="Selected tags" className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <li className="flex items-center" key={tag.id}>
              <TagBadge className="rounded-r-none bg-muted pr-1" tag={tag} />
              <Button
                aria-label={`Remove ${tag.name} tag`}
                className="-ml-px rounded-l-none bg-muted hover:bg-muted/70"
                disabled={disabled}
                onClick={() => removeTag(tag.id)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No tags selected.</p>
      )}

      {unlistedSelectedCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {unlistedSelectedCount} selected tag(s) will appear when available.
        </p>
      ) : null}

      <Button
        disabled={disabled}
        onClick={() => setIsPickerOpen(true)}
        type="button"
        variant="outline"
      >
        <Tags data-icon="inline-start" />
        Choose tags
      </Button>

      <Dialog onOpenChange={setIsPickerOpen} open={isPickerOpen}>
        <DialogContent className="gap-5 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Select tags</DialogTitle>
            <DialogDescription>
              Search your tag library and select as many tags as needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="sr-only" htmlFor="tag-selector-search">
              Search tags
            </label>
            <Input
              autoComplete="off"
              autoFocus
              disabled={disabled}
              id="tag-selector-search"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tags"
              value={searchTerm}
            />

            {isPending ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Loading tags...
              </p>
            ) : null}

            {isError ? (
              <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  Could not load tags. Try again.
                </p>
                <Button
                  onClick={() => refetch()}
                  type="button"
                  variant="outline"
                >
                  <RefreshCw data-icon="inline-start" />
                  Try again
                </Button>
              </div>
            ) : null}

            {!isPending && !isError && availableTags.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                No tags found. Create one to start classifying your work.
              </p>
            ) : null}

            {!isPending && !isError && availableTags.length > 0 ? (
              <ul
                aria-label="Available tags"
                className="max-h-72 space-y-1 overflow-y-auto"
              >
                {availableTags.map((tag) => {
                  const isSelected = value.includes(tag.id);

                  return (
                    <li key={tag.id}>
                      <button
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                          isSelected && "bg-muted",
                        )}
                        disabled={disabled}
                        onClick={() => toggleTag(tag)}
                        type="button"
                      >
                        <span>#{tag.name}</span>
                        {isSelected ? <Check className="size-4" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {isFetching && !isPending ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Updating tags...
              </p>
            ) : null}
          </div>

          <Button
            disabled={disabled}
            onClick={() => setIsCreateTagDialogOpen(true)}
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Create new tag
          </Button>
        </DialogContent>
      </Dialog>

      <TagForm
        onCreated={handleTagCreated}
        onOpenChange={setIsCreateTagDialogOpen}
        open={isCreateTagDialogOpen}
      />
    </section>
  );
}
