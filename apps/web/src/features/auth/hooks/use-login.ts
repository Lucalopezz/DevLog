import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { login } from "../api/login";
import { currentUserQueryKey } from "../api/get-current-user";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,

    onSuccess: (user) => {
      toast.success("Login realizado com sucesso!");
      queryClient.setQueryData(currentUserQueryKey, user);
      navigate("/", { replace: true });
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
        ),
      );
    },
  });
};
