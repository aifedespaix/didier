import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['apps/client/**', 'jsdom'],
      ['packages/ui/**', 'jsdom'],
    ],
    setupFiles: ['apps/client/vitest.setup.ts'],
    exclude: ['**/node_modules/**', 'apps/client/e2e/**'],
    include: [
      'packages/**/*.{test,spec}.ts?(x)',
      'apps/**/*.{test,spec}.ts?(x)',
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
