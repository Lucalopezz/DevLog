import { useQuery } from "@tanstack/react-query";
import { getProject, getProjectQueryKey } from "../api/get-project";

export function useGetProject(projectId: string) {
  return useQuery({
    queryKey: getProjectQueryKey(projectId),
    queryFn: () => getProject(projectId),
    retry: false,
  });
}
