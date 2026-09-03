import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login } from "../api/login";
import { currentUserQueryKey } from "../api/get-current-user";

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,

    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      navigate("/", { replace: true });
    },
  });
};
