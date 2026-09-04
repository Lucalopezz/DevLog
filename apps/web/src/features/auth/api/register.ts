import { api } from '@/api/http'
import type { RegisterFormData, User } from '../types'

export async function registerUser(input: RegisterFormData): Promise<User> {
  // O backend cria o usuário em POST /users, mas não inicia a sessão.
  const { data } = await api.post<User>('/users', input)
  return data
}
