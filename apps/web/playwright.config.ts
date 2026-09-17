import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/mocked',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Vite embeds the API origin during build, not when the preview starts.
    command: 'pnpm build && pnpm preview --host localhost --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    env: { VITE_API_URL: 'http://localhost:3000/api' },
  },
})
