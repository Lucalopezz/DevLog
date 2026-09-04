import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string | string[]
}

/**
 * O Nest pode retornar uma mensagem única ou uma lista de mensagens.
 * Normalizar os dois formatos deixa os hooks livres para cuidar apenas do
 * fluxo da mutation e evita expor detalhes do Axios na interface.
 */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return fallback
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(' ')
  }

  return typeof message === 'string' && message.trim() ? message : fallback
}
