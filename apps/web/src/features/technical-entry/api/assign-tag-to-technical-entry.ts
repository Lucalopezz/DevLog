import { api } from "@/api/http";
import type { Tag } from "@/features/tags/types/tag";

export type AssignTagInput = {
  technicalEntryId: string;
  tagId: string;
};

export async function assignTagToTechnicalEntry(
  input: AssignTagInput,
): Promise<Tag> {
  const { data } = await api.post<Tag>(
    `/technical-entry/${input.technicalEntryId}/tags`,
    { tagId: input.tagId },
  );
  return data;
}
