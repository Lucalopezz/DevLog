import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(new URL('./.playwright-browsers', import.meta.url))

export default defineConfig({
  testDir: './e2e/full-stack',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 45_000,
  outputDir: './test-results/full-stack',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/full-stack', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter api start:prod',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NODE_ENV: 'test', PORT: '3001', CORS_ALLOWED_ORIGINS: 'http://localhost:4173' },
    },
    {
      command: 'pnpm build && pnpm preview --host localhost --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      timeout: 120_000,
      // Vite must receive the real test API origin before it compiles the app.
      env: { VITE_API_URL: 'http://localhost:3001/api' },
    },
  ],
})
