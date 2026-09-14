import { api } from "@/api/http";
import type { ListTagsParams, TagCollection } from "../types/tag";

export async function listTags(params: ListTagsParams): Promise<TagCollection> {
  const { data } = await api.get<TagCollection>("/tag", { params });
  return data;
}

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "lists"] as const,
  list: (params: ListTagsParams) => [...tagKeys.lists(), params] as const,
};
