import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const isRemote = !baseURL.includes('localhost');

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: isRemote ? 60000 : 30000, // Longer timeout for deployed app (cold starts, network)
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: isRemote ? 15000 : 10000,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // Only start dev server when testing locally (no BASE_URL)
    ...(baseURL.includes('localhost')
        ? {
              webServer: {
                  command: 'npm run dev',
                  url: baseURL,
                  reuseExistingServer: !process.env.CI,
                  timeout: 60 * 1000,
              },
          }
        : {}),
});
