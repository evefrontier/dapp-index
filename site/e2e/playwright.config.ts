import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const configDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(configDir, '..');

const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`;

/**
 * Visual-regression suite for the site frontend.
 *
 * Baselines are platform-scoped (`{platform}` in the snapshot path) because
 * font antialiasing differs between macOS (local dev) and Linux (CI). Commit
 * the Linux baselines for the CI gate; macOS baselines are for local iteration.
 * The preview server serves the production build, so run `bun run build` first.
 */
export default defineConfig({
  testDir: './specs',
  // `.e2e.ts` (not `.spec.ts`/`.test.ts`) keeps this suite disjoint from `bun test`,
  // which matches `*.spec.ts`/`*.test.ts` by default and would otherwise try to
  // execute these files too (Bun is pinned below the version with pathIgnorePatterns).
  testMatch: '**/*.e2e.ts',
  snapshotPathTemplate:
    '{testDir}/../__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['list']],
  use: {
    baseURL: PREVIEW_URL,
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--font-render-hinting=none'],
        },
      },
    },
  ],
  webServer: {
    // Pin host so the bound address matches PREVIEW_URL (vite defaults to IPv6 ::1).
    command: `bun run preview --host 127.0.0.1 --port ${PREVIEW_PORT} --strictPort`,
    cwd: siteDir,
    url: PREVIEW_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
