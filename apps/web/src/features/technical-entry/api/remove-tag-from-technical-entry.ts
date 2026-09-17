import { api } from "@/api/http";

export type RemoveTagInput = {
  technicalEntryId: string;
  tagId: string;
};

export async function removeTagFromTechnicalEntry({
  technicalEntryId,
  tagId,
}: RemoveTagInput): Promise<void> {
  await api.delete(`/technical-entry/${technicalEntryId}/tags/${tagId}`);
}
