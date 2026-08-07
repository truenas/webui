import { defineConfig, devices } from '@playwright/test';
import { loadTargetConfig } from './e2e/support/config';
import { storageStatePath } from './e2e/support/constants';

/**
 * Load local configuration if present. Uses Node's built-in env-file support
 * (>=20.12) rather than a `dotenv` dependency.
 *
 * Absence is normal — in CI the values come from Jenkins credentials, not a
 * file. Real variables always win, since `loadEnvFile` does not overwrite them.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env; environment variables are expected to be set directly.
}

/**
 * Fails fast, at config load, when the environment is incomplete — before any
 * browser starts. The error names every missing variable at once.
 */
const target = loadTargetConfig();

/**
 * Node-side TLS leniency, for the API client's connection to middleware.
 *
 * This is deliberately NOT conditional on the profile. Two distinct connections
 * are involved, and only one of them varies:
 *
 *   browser -> UI origin     shipped: HTTPS to the appliance (self-signed)
 *                            branch:  HTTP to localhost
 *                            => handled by `ignoreHTTPSErrors`, profile-scoped
 *
 *   Node -> middleware       always wss:// to the appliance (self-signed),
 *                            because `truenas-connection.ts` hardcodes the
 *                            scheme and every profile uses a real appliance
 *                            => unconditional
 *
 * Scoping this to `ignoreHttpsErrors` was a bug: in `branch` mode the browser
 * needs no leniency but the API client still does, and the symptom was a 30
 * second WebSocket timeout rather than a certificate error — made worse by
 * version discovery silently falling back to `FALLBACK_VERSION` when its
 * `fetch` hit the same certificate.
 *
 * An explicit value in the environment still wins, so verification can be
 * forced back on.
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn(
    `[${target.profile}] Node TLS verification disabled for middleware at `
    + `${target.middlewareHost} (self-signed appliance certificate). Test targets only.`,
  );
}

const isCi = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',

  /**
   * E2E specs are `*.e2e.ts`, not `*.spec.ts`.
   *
   * `*.spec.ts` belongs to Jest here — `jest.config.cjs` sets no `testMatch`,
   * so `jest-preset-angular`'s default sweeps up every `*.spec.ts` in the
   * repository. A shared suffix would have each runner trying to execute the
   * other's tests. The suffix is the primary separation; `e2e/` is also listed
   * in Jest's `testPathIgnorePatterns` as a second line of defence.
   */
  testMatch: '**/*.e2e.ts',

  /**
   * Serial execution (R3.4). Pools, services and system settings are global to
   * the appliance, so parallel workers against one instance interfere. Scaling
   * out means sharding across VM *instances*, not workers — that is D2.
   */
  workers: 1,
  fullyParallel: false,

  /** R8.2 — one retry absorbs environmental noise; it does not hide flakes. */
  retries: 1,

  /** No `.only` reaching CI. */
  forbidOnly: isCi,

  /**
   * Generous per-test timeout. TrueNAS operations are job-based and genuinely
   * slow — pool creation takes minutes (R8.3). Per-operation waits stay tight;
   * this ceiling only catches genuinely hung tests.
   */
  timeout: 10 * 60_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Feeds the Jenkins JUnit plugin, which is what makes per-test flake history
    // — and therefore the R8.4 quarantine policy — measurable (R7.4).
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: target.uiBaseUrl,
    ignoreHTTPSErrors: target.ignoreHttpsErrors,

    /**
     * Ceiling for a single action (`click`, `fill`, …).
     *
     * Without this, an action inherits the whole test timeout, so one wrong
     * selector burns the entire budget before reporting — a mistyped option id
     * cost five minutes to learn. Real interactions resolve well inside this;
     * genuinely slow *pages* are covered by the explicit per-assertion
     * timeouts in the flows instead (R8.3).
     */
    actionTimeout: 20_000,

    /**
     * `TN_SLOW_MO=<ms>` pauses between browser actions so a run can be followed
     * by eye. Pair with `--headed`. There is no CLI flag for this — it is a
     * launch option.
     *
     * Debugging affordance only, never a default: it is a fixed delay on every
     * action, which is what R8.3 rules out, and it scales with the number of
     * actions rather than with anything meaningful. It does not help with the
     * middleware rate limit either — that counts unauthenticated calls, and
     * everything after sign-in is exempt.
     */
    launchOptions: {
      slowMo: process.env.TN_SLOW_MO ? Number(process.env.TN_SLOW_MO) : undefined,
    },

    /** R7.1 — the artifacts of a failed nightly are the whole product. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    /**
     * `TN_VIDEO=1` records every test at 1280x720, for demonstrating or
     * reviewing a run. Otherwise video is kept only for a retry, which is when
     * it earns its cost (R7.1).
     *
     * Like `TN_SLOW_MO`, there is no CLI flag for this.
     */
    video: process.env.TN_VIDEO
      ? { mode: 'on', size: { width: 1280, height: 720 } }
      : 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /**
       * Everything that starts from an authenticated session.
       */
      name: 'authenticated',
      testDir: './e2e/tests',
      testIgnore: '**/unauthenticated/**',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: storageStatePath,
      },
    },
    {
      /**
       * Tests that must start from a signed-out browser — anything covering
       * sign-in, sign-out, or session identity.
       *
       * No `storageState` and no dependency on `setup`, deliberately: the token
       * bypass would defeat the point (R4.2). It also means these tests do not
       * wait on the setup project, so they still run when token auth is broken —
       * which is exactly when you want them reporting.
       */
      name: 'unauthenticated',
      testDir: './e2e/tests/unauthenticated',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
