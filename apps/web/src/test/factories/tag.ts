import type { Tag } from '@/features/tags/types/tag'

export function createTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'React',
    createdAt: '2026-09-14T12:00:00.000Z',
    updatedAt: '2026-09-14T12:00:00.000Z',
    ...overrides,
  }
}
