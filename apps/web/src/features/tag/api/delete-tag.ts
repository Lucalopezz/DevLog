import { api } from "@/api/http";
import type { Tag } from "../types/tag";

export async function deleteTag(id: string): Promise<Tag> {
  const { data } = await api.delete(`/tag/${id}`);
  return data;
}
