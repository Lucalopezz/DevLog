import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'vercel-same-origin.spec.ts',
  use: {
    baseURL: process.env.VERCEL_PREVIEW_URL,
    extraHTTPHeaders: process.env.VERCEL_OIDC_TOKEN
      ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
