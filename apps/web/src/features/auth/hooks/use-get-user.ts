import { useQuery } from "@tanstack/react-query";
import { currentUserQueryKey, getCurrentUser } from "../api/get-current-user";


  export function useGetUser() {
    return useQuery({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })
  }

