import type { Project } from '@/features/projects/types/project'

export function createProjectFixture(
  overrides: Partial<Project> = {},
): Project {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'DevLog',
    description: 'A technical journal for software projects.',
    status: 'ACTIVE',
    createdAt: '2026-09-14T10:00:00.000Z',
    updatedAt: '2026-09-14T10:00:00.000Z',
    ...overrides,
  }
}
