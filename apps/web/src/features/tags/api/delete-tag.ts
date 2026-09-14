import { api } from "@/api/http";

export async function deleteTag(tagId: string): Promise<void> {
  await api.delete(`/tag/${tagId}`);
}
