import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  // Config file already lives in /e2e, so keep tests in this same folder.
  testDir: '.',
  testMatch: '*.spec.mjs',
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:
        'python3 backend/manage.py migrate && python3 backend/manage.py seed_e2e_users && python3 backend/manage.py runserver 127.0.0.1:8000 --noreload',
      url: 'http://127.0.0.1:8000/api/health/live/',
      timeout: 180_000,
      reuseExistingServer: !isCI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      timeout: 120_000,
      reuseExistingServer: !isCI,
    },
  ],
});
