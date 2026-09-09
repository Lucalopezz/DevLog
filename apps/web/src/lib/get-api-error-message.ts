import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string | string[]
}

/**
 * Nest can return a single message or a list of messages.
 * Normalizing both formats lets hooks focus on the mutation
 * flow and avoids exposing Axios details in the interface.
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
