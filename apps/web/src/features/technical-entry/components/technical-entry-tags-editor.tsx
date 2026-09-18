import { useState } from "react";
import { TagSelector } from "@/features/tags/components/tag-selector";
import type { TechnicalEntry } from "../types/technical-entry";
import { useAssignTag } from "../hooks/use-assign-tag";
import { useRemoveTag } from "../hooks/use-remove-tag";

type Props = {
  entry: TechnicalEntry;
};

type LocalTagSelection = {
  serverTagKey: string;
  tagIds: string[];
};

function getTagKey(tagIds: string[]) {
  return JSON.stringify([...tagIds].sort());
}

export function TechnicalEntryTagsEditor({ entry }: Props) {
  const serverTagIds = entry.tags?.map((tag) => tag.id) ?? [];
  // '["tag-1","tag-2"]'
  const serverTagKey = getTagKey(serverTagIds);
  const [localSelection, setLocalSelection] = useState<LocalTagSelection>(
    () => ({
      serverTagKey,
      tagIds: serverTagIds,
    }),
  );
  const assignMutation = useAssignTag();
  const removeMutation = useRemoveTag();

  // `localSelection` shows the user's latest change immediately, while
  // `serverTagIds` represents the last tag list received from the API.
  // When their keys match, the server has not provided a newer snapshot yet,
  // so we keep showing the local value. When they differ, React Query has
  // returned a new server snapshot and we trust that value instead. Deriving
  // the displayed value here avoids calling setState from a useEffect.
  const tagIds =
    localSelection.serverTagKey === serverTagKey
      ? localSelection.tagIds
      : serverTagIds;

  async function handleChange(nextTagIds: string[]) {
    const previous = new Set(tagIds);
    const next = new Set(nextTagIds);
    //Find a tag that exists in the new selection but did not exist before.
    //{"1", "2"} -> ["1", "2", "3"] -> addedTagId = "3"
    const addedTagId = nextTagIds.find((id) => !previous.has(id));
    // Find a tag that existed before but no longer exists.
    const removedTagId = tagIds.find((id) => !next.has(id));

    // TagSelector changes one item at a time, so one of these branches should
    // run for each interaction.
    setLocalSelection({ serverTagKey, tagIds: nextTagIds });

    try {
      if (addedTagId) {
        await assignMutation.mutateAsync({
          technicalEntryId: entry.id,
          tagId: addedTagId,
          projectId: entry.projectId,
        });
      }

      if (removedTagId) {
        await removeMutation.mutateAsync({
          technicalEntryId: entry.id,
          tagId: removedTagId,
          projectId: entry.projectId,
        });
      }
    } catch {
      // Restore the last known server value if the relationship request fails.
      setLocalSelection({
        serverTagKey,
        tagIds: [...previous],
      });
    }
  }

  return (
    <TagSelector
      disabled={assignMutation.isPending || removeMutation.isPending}
      onChange={(nextTagIds) => void handleChange(nextTagIds)}
      value={tagIds}
    />
  );
}
