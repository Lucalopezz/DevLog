import { isAxiosError } from "axios";
import { redirect } from "react-router";
import { currentUserQueryKey, getCurrentUser } from "@/features/auth/api/get-current-user";
import type { User } from "@/features/auth/types";
import { queryClient } from "@/lib/query-client";

/**
 * Executa antes de toda rota protegida.
 *
 * `query` é a API recomendada pela versão atual do TanStack Query. Ele usa o
 * mesmo cache que `useGetUser`, sem criar uma segunda fonte de verdade.
 */
export async function requireUser(): Promise<User> {
  try {
    return await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw redirect('/login');
    }

    throw error;
  }
}

/**
 * Loader para páginas destinadas apenas a visitantes.
 * Uma resposta 401 é esperada nesse caso: significa que não há sessão.
 */
export async function redirectAuthenticatedUser(): Promise<void> {
  try {
    await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })

    throw redirect('/');
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return
    }

    // O redirect é uma Response lançada de propósito e deve continuar sendo
    // tratado pelo React Router.
    throw error
  }
}
