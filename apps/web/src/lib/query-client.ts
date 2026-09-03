import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados ficam em cache antes de serem considerados "stale" (obsoletos)
      // Não significa que os dados serão removidos do cache após esse tempo, 
      // apenas que eles serão considerados obsoletos e podem ser refetchados se necessário
      staleTime: 30_000,
      // Desativa a refetch automático dos dados quando a janela do navegador ganha foco
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Se o erro for um erro do Axios e o status da resposta for menor que 500, não tenta refazer a requisição
        // Erro do usuário (4xx) não deve ser tratado como um erro do servidor (5xx)
        if (isAxiosError(error) && error.response?.status && error.response.status < 500) {
          return false
        }
        // Permite até 2 tentativas de refazer a requisição em caso de erro
        return failureCount < 2
      },
    },
  },
})
