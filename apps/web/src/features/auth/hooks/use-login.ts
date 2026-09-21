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
      toast.success("Signed in successfully!");
      queryClient.setQueryData(currentUserQueryKey, user);
      navigate("/dashboard", { replace: true });
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not sign in. Check your credentials and try again.",
        ),
      );
    },
  });
};
