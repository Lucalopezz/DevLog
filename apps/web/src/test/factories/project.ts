import type { Meta } from '@/api/types'
import type {
  Project,
  ProjectCollection,
} from '@/features/projects/types/project'

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

export function createProjectCollection({
  projects = [],
  meta,
}: {
  projects?: Project[]
  meta: Meta
}): ProjectCollection {
  // Pagination metadata is explicit because a page can contain fewer records
  // than the server-side total. Inferring total from projects.length would
  // make pagination tests accidentally describe the wrong contract.
  return { data: projects, meta }
}
