import { api } from '@/api/http'
import type { User } from '../types/auth'
import type { UpdatePasswordInput } from '../schemas/settings.schema'

export async function updateUserPassword(
  input: UpdatePasswordInput,
): Promise<User> {
  const { data } = await api.patch<User>('/users/me/password', input)
  return data
}
