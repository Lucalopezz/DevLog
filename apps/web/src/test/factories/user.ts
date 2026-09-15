import type { User } from '@/features/auth/types/auth'

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    ...overrides,
  }
}
