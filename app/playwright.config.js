import { defineConfig, devices } from '@playwright/test'

// Playwright config for WillowDriveFE.
//
// Prerequisites for running e2e tests:
//   - v2 API listening at https://localhost:7077 (the URL hardcoded in src/services/api.js for dev)
//     -> from WillowDrivev2/, run `dotnet run` (default profile binds 7077).
//   - SQL Server T9 reachable with the standard test users (kiosk, testAdmin, etc.).
//
// Playwright starts Vite itself (webServer below).
//
// Run with:
//   npm run test:e2e            # headless, one-shot
//   npm run test:e2e:ui         # interactive UI
//   npm run test:e2e -- --debug # step through tests
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:5173',
    // The v2 API uses a dev cert at https://localhost:7077 -- browser must not reject it.
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
