import { defineConfig, devices } from '@playwright/test';
import { describeTarget, loadTargetConfig } from './e2e/support/config';
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
 * Do not scope this to `ignoreHttpsErrors`: in `branch` mode the browser needs
 * no leniency but the API client still does, and the symptom is a 30 second
 * WebSocket timeout rather than a certificate error — version discovery falls
 * back to `FALLBACK_VERSION` when its `fetch` hits the same certificate, so
 * nothing names the cause.
 *
 * ## Why it is process-wide, which is worse than it should be
 *
 * `NODE_TLS_REJECT_UNAUTHORIZED` is a blunt instrument: it turns verification
 * off for every outbound TLS connection this process makes, for the life of the
 * process, including ones added later by someone who never reads this comment.
 * Scoping it to the one connection that needs it would be strictly better.
 *
 * There is no seam for that, verified against `@truenas/api-client@3.0.2`:
 * `CreateClientOptions` takes `uuid`, `hostnames`, `enabled`, `systemName` and
 * `logger` — no `WebSocketCtor`, no dispatcher, no TLS options — and the socket
 * is built internally from an rxjs `WebSocketSubjectConfig` the caller never
 * sees. Version discovery's `fetch` needs the same leniency and has no seam
 * either. `NODE_EXTRA_CA_CERTS` is not an answer while the certificate is
 * generated per appliance at install time.
 *
 * So this stays, deliberately and visibly, until the client exposes one of
 * those. It is tracked under "Known gaps" in `docs/status.md` so it
 * does not become permanent by default, and the banner below states it on every
 * run rather than letting it pass unnoticed.
 *
 * An explicit value in the environment still wins, so verification can be
 * forced back on.
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Announce the resolved target before anything runs.
 *
 * This suite exports pools with `destroy: true` and deletes users, so the
 * machine it is pointed at is not a detail to bury in a log line. Emitted after
 * the TLS decision above so the banner reports what is actually in effect.
 *
 * Guarded because this file is not evaluated once. Playwright re-loads the
 * config in every worker process, and spawns a replacement worker after a failed
 * test — so an unguarded `console.warn` reprints the banner partway through the
 * output, which is precisely where a warning stops being read. Workers are
 * forked and inherit this environment, so setting the flag here silences them.
 */
const announcedVar = 'TN_TARGET_ANNOUNCED';
if (!process.env[announcedVar]) {
  process.env[announcedVar] = '1';
  // Fields listed explicitly rather than passing `target`, so the credentials on
  // it have no path to a log line — see `TargetSummary`.
  console.warn(describeTarget({
    profile: target.profile,
    uiBaseUrl: target.uiBaseUrl,
    middlewareHost: target.middlewareHost,
    hostSource: target.hostSource,
  }));
}

const isCi = !!process.env.CI;

/**
 * Debugging flags are opt-in on `=1`, matching `TN_KEEP_TEST_DATA` in the specs.
 *
 * Not a truthiness check on the raw value: `TN_VIDEO=0` would then *enable*
 * recording, which is the opposite of what anyone typing it means.
 */
const recordVideo = process.env.TN_VIDEO === '1';

/**
 * `TN_SLOW_MO=<ms>`, or undefined when unset or not a number.
 *
 * `Number('')` is 0 and `Number('abc')` is `NaN`; neither is a delay, and both
 * would otherwise reach `slowMo`.
 */
const slowMoMs = (() => {
  const raw = process.env.TN_SLOW_MO;
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(`Ignoring TN_SLOW_MO="${raw}" — expected a positive number of milliseconds.`);
    return undefined;
  }

  return parsed;
})();

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

  /**
   * R8.2 — one retry absorbs environmental noise in CI; it does not hide flakes.
   *
   * Off locally, matching `forbidOnly` below: retrying while iterating on a
   * test only doubles the wait to learn the same thing.
   */
  retries: isCi ? 1 : 0,

  /** No `.only` reaching CI. */
  forbidOnly: isCi,

  /**
   * Per-test ceiling, covering the hooks — Playwright counts `beforeEach` and
   * `afterEach` against the same budget, and `fresh-install` cleans up in both.
   *
   * Sized for the expected slow path, not the worst one. One pool export per
   * hook plus the journey's own pool creation is about 17 minutes, so 20 leaves
   * the fixture timeouts spendable and lets them report what a failure costs
   * rather than being cut short by Playwright's own message.
   *
   * It deliberately does not cover every fixture timing out at once. `cleanUp`
   * runs all four steps even after one throws, so that case is nearer 29
   * minutes — but it means the appliance is unreachable and the run is lost
   * whatever this number is, and covering it would put a single retried test
   * past R8.1's 45 minutes for the whole suite.
   */
  timeout: 20 * 60_000,
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
      // Parsed rather than truthiness-checked: `Number('abc')` is `NaN`, and
      // handing `NaN` to `slowMo` is a silent no-op that looks like the flag
      // being ignored.
      slowMo: slowMoMs,
    },

    /**
     * R7.1 — the artifacts of a failed nightly are the whole product.
     *
     * The mode has to follow `retries` above. `on-first-retry` records nothing
     * at all when there is no retry, so pairing it with local retries of 0 would
     * silently take the trace away from exactly the person who needs it — while
     * `README.md` and `CLAUDE.md` both still tell them to open one. Locally the
     * trace is retained on failure instead; in CI the retry is the cheaper hook,
     * since tracing every test on a nightly buys nothing for the ones that pass.
     */
    trace: isCi ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',

    /**
     * `TN_VIDEO=1` records every test at 1280x720, for demonstrating or
     * reviewing a run. Otherwise video is kept only for a CI retry, which is
     * when it earns its cost (R7.1).
     *
     * Deliberately not given the local `retain-on-failure` treatment the trace
     * gets: video is recorded for every test and thrown away for the ones that
     * pass, and unlike a trace it costs on the passing majority while adding
     * nothing a trace's DOM snapshots do not already show. `TN_VIDEO=1` is there
     * for the cases where watching it really is what you want.
     *
     * Like `TN_SLOW_MO`, there is no CLI flag for this.
     */
    video: recordVideo
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
