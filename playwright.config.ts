import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/client/e2e',
  webServer: {
    command: 'pnpm --filter @aife/client dev',
    port: 3000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
