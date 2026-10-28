import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/fixtures/global-setup.ts',
  globalTeardown: './tests/fixtures/global-teardown.ts',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    downloadsPath: '/tmp/pwt-downloads',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      timeout: 120000,
    },
  ],
});
