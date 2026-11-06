import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;

/**
 * Runs against the real build output, not a dev server, so the suite tests what actually ships.
 * `scripts/serve-dist.mjs` is the same server the screenshot capture uses.
 */
export default defineConfig({
  testDir: './e2e',
  // A failing a11y assertion is a real defect on this site, not flake. Retries would hide it.
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
