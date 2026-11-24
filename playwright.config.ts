import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { describeTarget, loadTargetConfig } from './e2e/support/config';
import type { E2eTestOptions, E2eWorkerFixtures } from './e2e/support/fixtures';
import { timingsDirName, timingsDirVar } from './e2e/support/timings';

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
 * Node-side TLS leniency for the API client's wss:// connection to middleware, which is always self-signed.
 * Not tied to `ignoreHTTPSErrors`: in `branch` mode the browser needs none but the client still does, and the
 * failure is an unexplained 30-second WebSocket timeout. It's process-wide because `@truenas/api-client` has
 * no TLS seam (checked at 5.0.0); kept visibly, with the banner below, until it does (see "Known gaps" in
 * `docs/status.md`). An explicit `NODE_TLS_REJECT_UNAUTHORIZED` still wins.
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Where `support/timings.ts` and `support/timing-reporter.ts` record, set here
 * because Jest compiles `timings.ts` too and could not parse the
 * `import.meta.dirname` locating it there. Workers inherit it.
 */
process.env[timingsDirVar] ??= join(import.meta.dirname, 'test-results', timingsDirName);

/**
 * Announces the resolved target first, since the suite destroys pools and deletes users, and after the TLS
 * decision so it reports what's in effect. Guarded because Playwright reloads this config in every worker,
 * including replacements after a failure; forked workers inherit the flag, so the banner prints once.
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

/** The specs the `apps` project runs, and `authenticated` leaves to it. */
const appsSpecs = '**/apps-*.e2e.ts';

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

/** Token sign-in, checked once before either suite: see `e2e/support/auth/auth.setup.ts`. */
const setupProject = {
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
  use: { ...devices['Desktop Chrome'] },
};

/**
 * The single-appliance suite: everything under `e2e/tests`.
 */
const singleApplianceProjects = [
  setupProject,
  {
    /**
     * The Apps specs, which share one Apps pool: the `appsPool` fixture builds `e2e_apps` once and
     * releases it when the worker ends. A project of their own because only a project is sure to
     * end its worker, with the pool, when its specs are done. In `authenticated` the pool and Docker
     * would stay up through every spec after them.
     *
     * Before `authenticated`: shards split the run by test count in this order, and the apps specs
     * are few and slow, so they go at the start of the first shard, where they always ran.
     */
    name: 'apps',
    testDir: './e2e/tests',
    testMatch: appsSpecs,
    dependencies: ['setup'],
    use: { ...devices['Desktop Chrome'] },
  },
  {
    /**
     * Everything that starts from an authenticated session.
     *
     * The sign-in happens per test, in the `page` fixture (`support/fixtures.ts`),
     * not through a `storageState` captured by `setup`: the app rotates the
     * persisted token into a five-minute single-use one on every login, so a
     * snapshot of it only ever carries the first test. `setup` still runs
     * first — it is the earliest, clearest report that token login is broken.
     */
    name: 'authenticated',
    testDir: './e2e/tests',
    testIgnore: ['**/unauthenticated/**', '**/unpublished/**', appsSpecs],
    dependencies: ['setup'],
    use: { ...devices['Desktop Chrome'] },
  },
  {
    /**
     * Specs in `tests/unpublished/` type a long-lived secret (the AD test domain's credentials). Traces and
     * `error-context.md` capture input values and this public repo publishes `test-results/`, so CI traces
     * nothing here and output goes to an `outputDir` outside it, which only a project can set.
     */
    name: 'unpublished',
    testDir: './e2e/tests/unpublished',
    outputDir: 'test-results-unpublished/unpublished',
    dependencies: ['setup'],
    use: {
      ...devices['Desktop Chrome'],
      trace: isCi ? 'off' as const : 'retain-on-failure' as const,
    },
  },
  {
    /**
     * Tests that must start from a signed-out browser — anything covering
     * sign-in, sign-out, or session identity.
     *
     * `authenticate: false` and no dependency on `setup`, deliberately: the
     * token bypass would defeat the point (R4.2). It also means these tests do
     * not wait on the setup project, so they still run when token auth is
     * broken — which is exactly when you want them reporting.
     */
    name: 'unauthenticated',
    testDir: './e2e/tests/unauthenticated',
    use: { ...devices['Desktop Chrome'], authenticate: false },
  },
];

/**
 * The HA suite (`e2e/tests-ha`), run instead of the single-appliance one when `TN_HA=true`. Each project depends
 * on the last because each journey builds on it (license, VIP, pool, failover); none is retried, since each
 * changes the pair for good. `ha-license` records nothing and writes to its own `outputDir`, outside the
 * published `test-results/`, because every artifact would capture the pasted license. `ha-failover` signs in
 * through the VIP (`haThroughVip`), like a user would.
 */
const haProjects = target.ha
  ? [
      setupProject,
      {
        name: 'ha-license',
        retries: 0,
        testDir: './e2e/tests-ha',
        testMatch: /ha-license\.e2e\.ts/,
        outputDir: 'test-results-unpublished/ha-license',
        dependencies: ['setup'],
        use: {
          ...devices['Desktop Chrome'], trace: 'off' as const, screenshot: 'off' as const, video: 'off' as const,
        },
      },
      {
        name: 'ha-setup',
        retries: 0,
        testDir: './e2e/tests-ha',
        testMatch: /ha-setup\.e2e\.ts/,
        dependencies: ['ha-license'],
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'ha-failover',
        retries: 0,
        testDir: './e2e/tests-ha',
        testMatch: /ha-failover\.e2e\.ts/,
        dependencies: ['ha-setup'],
        // Traced every time, not only on a retry, which this chain never takes:
        // what the app does while the pair changes hands is the subject, and a
        // screenshot of a spinner does not say which call it is waiting on.
        use: {
          ...devices['Desktop Chrome'], haThroughVip: true, baseURL: target.ha.vipUiBaseUrl, trace: 'on' as const,
        },
      },
      {
        // What only an HA-licensed system offers, once the chain above has left
        // the pair healthy. Its specs restore what they change, so unlike the
        // chain they keep the usual retry.
        name: 'ha-features',
        testDir: './e2e/tests-ha',
        testMatch: /ha-smb-stateful-failover\.e2e\.ts/,
        dependencies: ['ha-failover'],
        use: { ...devices['Desktop Chrome'], haThroughVip: true, baseURL: target.ha.vipUiBaseUrl },
      },
    ]
  : [];

export default defineConfig<E2eTestOptions, Pick<E2eWorkerFixtures, 'haThroughVip'>>({
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
   * Per-test ceiling, hooks included (`fresh-install` cleans up in both). Sized for the expected slow path:
   * a pool export per hook plus pool creation is about 17 minutes, so fixture timeouts can still report.
   * Every fixture timing out at once (~29 minutes) means a lost run anyway, and covering it would push one
   * retried test past R8.1's 45 minutes.
   */
  timeout: 20 * 60_000,
  expect: { timeout: 15_000 },

  reporter: [
    // `list`, reformatted: run time in a fixed column, no project tag. Its tally
    // — `N flaky` above all — is the only place a retried test shows, so it keeps
    // Playwright's wording exactly. See the file.
    ['./e2e/support/list-reporter.ts'],
    // In CI, a warning annotation and a job summary row per flaky test, so a
    // green run that needed retries says so on its page. See the file.
    ['./e2e/support/flaky-reporter.ts'],
    // Where each test's time went — hooks, fixtures, the body — for
    // `yarn e2e:timings`, beside what `support/timings.ts` records of
    // middleware. See the file.
    ['./e2e/support/timing-reporter.ts'],
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
     * `TN_SLOW_MO=<ms>` pauses between browser actions so a `--headed` run can be followed (a launch option,
     * no CLI flag). Debugging only: a fixed per-action delay is what R8.3 rules out, and it doesn't help with
     * the rate limit, which only counts unauthenticated calls.
     */
    launchOptions: {
      // Parsed rather than truthiness-checked: `Number('abc')` is `NaN`, and
      // handing `NaN` to `slowMo` is a silent no-op that looks like the flag
      // being ignored.
      slowMo: slowMoMs,
    },

    /**
     * R7.1: a failed nightly's artifacts are the whole product. The mode follows `retries`: `on-first-retry`
     * records nothing without a retry, so locally (0 retries) the trace is retained on failure instead.
     */
    trace: isCi ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',

    /**
     * `TN_VIDEO=1` records every test at 1280x720 for demos or reviews (no CLI flag). Otherwise video is kept
     * only for a CI retry (R7.1); unlike a trace it costs on every passing test and adds nothing a trace's DOM
     * snapshots don't show, so it gets no local `retain-on-failure`.
     */
    video: recordVideo
      ? { mode: 'on', size: { width: 1280, height: 720 } }
      : 'on-first-retry',
  },

  projects: target.ha ? haProjects : singleApplianceProjects,
});
