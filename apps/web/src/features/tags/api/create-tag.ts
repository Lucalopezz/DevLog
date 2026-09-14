import { api } from "@/api/http";
import type { CreateTagInput, Tag } from "../types/tag";

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const { data } = await api.post<Tag>("/tag", input);
  return data;
}
