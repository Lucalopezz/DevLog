import { test as base, expect, type Page, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
export const apiOrigin = 'http://localhost:3001/api'

export type Account = { name: string; email: string; password: string }
type Accounts = {
  draft: () => Account
  track: (id: string) => Promise<void>
  create: () => Promise<Account>
}

export const test = base.extend<{ accounts: Accounts }>({
  accounts: async ({ request }, runTest, testInfo) => {
    const ids = new Set<string>()
    const manifest = testInfo.outputPath('created-users.json')
    const draft = (): Account => ({
      name: 'Journal Reader', email: `e2e-${randomUUID()}@example.test`, password: 'test-password-123',
    })
    const track = async (id: string) => {
      ids.add(id)
      await mkdir(dirname(manifest), { recursive: true })
      // IDs only: an interrupted local run can be cleaned up without saving credentials.
      await writeFile(manifest, JSON.stringify([...ids]))
    }
    try {
      await runTest({
        draft, track,
        create: async () => {
          const account = draft()
          const response = await request.post(`${apiOrigin}/users`, { data: { ...account, confirmPassword: account.password } })
          expect(response.status(), 'Register the prerequisite test account').toBe(201)
          await track((await response.json() as { id: string }).id)
          return account
        },
      })
    } finally {
      if (ids.size) {
        // Cleanup stays in the API package; Prisma never enters the web bundle.
        await execFileAsync('pnpm', ['--filter', 'api', 'db:test:cleanup-users', '--', ...ids], {
          cwd: fileURLToPath(new URL('../../../../', import.meta.url)),
          timeout: 30_000,
        })
        await writeFile(manifest, '[]')
      }
    }
  },
})

export { expect }

export async function signIn(page: Page, account: Account) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function seedProject(request: APIRequestContext, account: Account, name = 'Persistent project') {
  // APIRequestContext owns a separate cookie jar. Each test still signs in via
  // the browser so browser cookie/CORS behavior is exercised independently.
  expect((await request.post(`${apiOrigin}/auth/login`, { data: { email: account.email, password: account.password } })).status()).toBe(200)
  const response = await request.post(`${apiOrigin}/project`, { data: { name } })
  expect(response.status()).toBe(201)
  return await response.json() as { id: string; name: string }
}
