import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const backendPort = process.env.E2E_BACKEND_PORT || '18000';
const frontendPort = process.env.E2E_FRONTEND_PORT || '14173';
const backendBaseUrl = `http://127.0.0.1:${backendPort}`;
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;

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
    baseURL: frontendBaseUrl,
    headless: true,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:
        `python3 backend/manage.py migrate && python3 backend/manage.py seed_e2e_users && python3 backend/manage.py runserver 127.0.0.1:${backendPort} --noreload`,
      url: `${backendBaseUrl}/api/health/live/`,
      timeout: 180_000,
      reuseExistingServer: false,
      cwd: '..',
    },
    {
      command: `VITE_API_PROXY_TARGET=${backendBaseUrl} VITE_WS_PROXY_TARGET=${backendBaseUrl} npm run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      url: frontendBaseUrl,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: '..',
    },
  ],
});
