import { defineConfig, devices } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:5173'
const BACKEND_PORT = 8000

/**
 * Playwright сам поднимает оба сервера:
 *  - бэкенд (FastAPI/uvicorn из backend/.venv) на :8000;
 *  - фронтенд (Vite) на :5173, настроенный ходить на этот бэкенд.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command:
        'cd ../backend && .venv/bin/python -m uvicorn app.main:app --port ' +
        BACKEND_PORT,
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'cd ../frontend && npm run dev -- --port 5173 --strictPort',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: `http://localhost:${BACKEND_PORT}`,
      },
    },
  ],
})
