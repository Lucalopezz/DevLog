import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listTags, tagKeys } from "../api/list-tags";
import type { ListTagsParams, TagCollection } from "../types/tag";

type UseTagsOptions = Pick<
  UseQueryOptions<TagCollection, Error>,
  "enabled"
>;

export function useTags(params: ListTagsParams = {}, options?: UseTagsOptions) {
  return useQuery({
    ...options,
    queryKey: tagKeys.list(params),
    queryFn: () => listTags(params),
  });
}
