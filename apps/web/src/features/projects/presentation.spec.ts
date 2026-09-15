import { describe, expect, it } from 'vitest'

import {
  presentProjectStatus,
  resourcePresentation,
} from './presentation'

describe('project presentation', () => {
  it.each([
    ['ACTIVE', 'Active'],
    ['INACTIVE', 'Inactive'],
    ['FINISHED', 'Finished'],
  ] as const)('labels status %s as %s', (status, label) => {
    expect(presentProjectStatus(status).label).toBe(label)
  })

  it.each([
    ['REPOSITORY', 'Repository'],
    ['DOCUMENTATION', 'Documentation'],
    ['LOCAL_URL', 'Local URL'],
    ['EXTERNAL_URL', 'External link'],
    ['OTHER', 'Resource'],
  ] as const)('labels resource type %s as %s', (type, label) => {
    expect(resourcePresentation[type].label).toBe(label)
  })
})
