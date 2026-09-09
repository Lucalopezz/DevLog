import { api } from '@/api/http'
import type { RegisterFormData, User } from '../types/auth'

export async function registerUser(input: RegisterFormData): Promise<User> {
  // The backend creates the user through POST /users but does not start a session.
  const { data } = await api.post<User>('/users', input)
  return data
}
