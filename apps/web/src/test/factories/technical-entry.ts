import type { TechnicalEntry } from '@/features/technical-entry/types/technical-entry'

export function createTechnicalEntry(
  overrides: Partial<TechnicalEntry> = {},
): TechnicalEntry {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    projectId: '22222222-2222-4222-8222-222222222222',
    title: 'Understand query invalidation',
    context: 'Review how related cached collections become stale.',
    conclusion: 'Invalidate every representation affected by a mutation.',
    type: 'LEARNING',
    status: 'OPEN',
    createdAt: '2026-09-14T11:00:00.000Z',
    updatedAt: '2026-09-14T11:00:00.000Z',
    ...overrides,
  }
}
