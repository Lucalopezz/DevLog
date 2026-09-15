import { expect, it } from 'vitest'

import { cn } from './utils'

it('combines conditional classes and keeps the final conflicting utility', () => {
  expect(cn('px-2 text-sm', { hidden: false }, ['px-4', 'font-medium'])).toBe(
    'text-sm px-4 font-medium',
  )
})
