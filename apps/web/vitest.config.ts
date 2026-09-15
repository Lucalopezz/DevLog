import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.spec.{ts,tsx}'],
      clearMocks: true,
      restoreMocks: true,
      env: {
        VITE_API_URL: 'http://localhost:3000/api',
        TZ: 'UTC',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.spec.{ts,tsx}',
          'src/test/**',
          'src/**/types/**',
          'src/api/types.ts',
          'src/assets/**',
          'src/components/ui/**',
          'src/main.tsx',
        ],
      },
    },
  }),
)
