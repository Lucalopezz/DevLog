import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { logout } from "../api/logout";

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,

    onSuccess: async () => {
      // Every current query is user-scoped today. Cancel first so a response
      // started by the previous session cannot repopulate the cache after the
      // next account signs in, then remove all private server state.
      await queryClient.cancelQueries()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  });
};
