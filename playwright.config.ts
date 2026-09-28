import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  // Port 4399 so a hand-started preview on 4321 can stay open while tests run.
  use: { baseURL: 'http://localhost:4399', channel: 'msedge' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run build && node tools/serve-dist.mjs 4399',
    url: 'http://localhost:4399/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
