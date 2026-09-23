import { api } from '@/api/http'
import type { User } from '../types/auth'
import type { UpdateUserInput } from '../schemas/settings.schema'

export async function updateUser(input: UpdateUserInput): Promise<User> {
  const { data } = await api.patch<User>('/users/me', input)
  return data
}
