import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { logout } from "../api/logout";
import { currentUserQueryKey } from "../api/get-current-user";

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,

    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: currentUserQueryKey,
      });
      navigate("/login", { replace: true });
    },
  });
};
