import { useQuery } from "@tanstack/react-query";
import { listTags, tagKeys } from "../api/list-tags";
import type { ListTagsParams } from "../types/tag";

export function useTags(params: ListTagsParams = {}) {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: () => listTags(params),
  });
}
