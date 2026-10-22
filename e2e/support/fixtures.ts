/**
 * The suite's `test` object. Import this instead of `@playwright/test`.
 *
 * Provides a connected, authenticated middleware client as a fixture, so a spec
 * never wires one up by hand:
 *
 *     let api: E2eApiClient;
 *     test.beforeAll(async () => { api = await connectAndLogin(config); });
 *     test.afterAll(() => { api?.close(); });
 *
 * Copying it is how a socket gets left open — forget the `afterAll` and the
 * runner hangs at the end of a green run, which reads as a hang rather than a
 * mistake.
 *
 * It also signs the browser in. Every test in a project that leaves
 * `authenticate` on (the default) starts with `page` already inside the admin
 * shell — see the `page` override below for why that is done per test rather
 * than once through `storageState`.
 */
import { basename } from 'node:path';
import { expect, type Page, test as base } from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { clearRateLimit, enablePrivateMethods } from './api/rate-limit';
import { recordApiCalls } from './api-calls';
import {
  acquireApplianceLock, type ApplianceAccess, lockWaitTimeoutMs, markSharedPoolUsed, withRunMutex,
} from './appliance-lock';
import { buildTokenLoginUrl, generateAuthToken } from './auth/token';
import { keepTestData } from './cleanup';
import { loadTargetConfig, type TargetConfig, throughVip } from './config';
import {
  adminLayout, concurrentCallsDialogTitleId, errorDialog, errorDialogClose,
} from './constants';
import { CoverageRecorder } from './coverage';
import { type EntitlementDecisions, readEntitlements } from '../fixtures/entitlements';
import { poolLifecycle, suiteOwnedPoolName } from '../fixtures/pool';

/**
 * The wall-clock budget for signing in, how long one attempt may wait for the
 * shell, and the pause before trying again.
 *
 * A budget rather than an attempt count, because the two ways an attempt fails
 * take wildly different times. When the web server is down `page.goto` rejects
 * in milliseconds, so three counted attempts would be over in under a second;
 * when it is up but the app has not rendered, the assertion waits its full
 * timeout. Attempts run until the deadline, each bounded to what is left, with
 * a pause between them so a down server is retried rather than hammered.
 *
 * The UI is not always there to be logged into: when a pool holding the system
 * dataset is exported or imported, the appliance restarts what depends on it
 * and the token URL loads nothing usable for a while. A re-navigation is what a
 * stalled page needs, and a single long wait never re-navigates.
 */
const tokenLoginBudgetMs = 90_000;
const tokenLoginAttemptTimeoutMs = 30_000;
const tokenLoginRetryDelayMs = 5_000;

/** What one wait may take: the attempt ceiling, or less when the budget is nearly spent. */
function remainingOf(deadline: number): number {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) {
    throw new Error('the login budget ran out before the admin shell could be awaited');
  }
  return Math.min(tokenLoginAttemptTimeoutMs, remainingMs);
}

const maxConcurrentCallsDismissals = 3;

/**
 * Dismisses the development build's concurrency diagnostic wherever it appears.
 *
 * Page scope, not sign-in scope: it blocks any chatty page, and the
 * authenticated projects enter by token URL onto `/dashboard`, not the form.
 * `addLocatorHandler` runs before actionability checks.
 */
async function dismissConcurrencyDialogs(page: Page): Promise<void> {
  // Found by its title's id, not its wording. Every error opens the same
  // component, so this one names itself `concurrent-calls`
  // (`ErrorReport.testId`), which is what keeps a reworded or translated
  // message from silently stopping this matching.
  const concurrencyDialog = page
    .locator(errorDialog)
    .filter({ has: page.locator(concurrentCallsDialogTitleId) });

  // Dismissed through the dialog that triggered the handler rather than every
  // close button on the page, and through the whole dialog because the footer
  // holding Close sits outside the block carrying the alertdialog role.
  //
  // Capped, because the dialog re-arms when dismissed. Past the cap it stays on
  // screen and `awaitAdminShell` reports it, which is the right outcome for a
  // page issuing calls faster than the connection retires them for that long.
  await page.addLocatorHandler(concurrencyDialog, async () => {
    await concurrencyDialog.locator(errorDialogClose).click();
  }, { times: maxConcurrentCallsDismissals });
}

/**
 * Signs `page` in through the token URL, with a token minted for this login.
 *
 * Per login, not per worker, because a token only ever carries one browser
 * session. Three CI runs on 2026-09-08 (34255132927, 34256452773 and the
 * one before them) showed the same shape whatever else changed between tests:
 * the first authenticated test in a worker signed in, the next one waited the
 * full timeout on the same token and saw no shell, and the retry Playwright
 * spawned — a fresh worker, a fresh token — was in within seconds. Middleware
 * stops honouring the token once the session that redeemed it is gone, so
 * reusing one across tests can never work. Minting is one authenticated call,
 * which the rate limit exempts, so it costs nothing worth saving.
 *
 * The mint is inside the `authenticate` branch rather than a fixture the
 * `page` override depends on: Playwright builds the fixture graph from what a
 * fixture destructures, not from which branches read it, so a token fixture in
 * `page`'s signature would run for the `unauthenticated` project too — whose
 * whole point is to keep running when token login is broken (R4.2).
 */
async function signInWithToken(page: Page, client: E2eApiClient, config: TargetConfig): Promise<void> {
  const deadline = Date.now() + tokenLoginBudgetMs;
  let attempts = 0;
  let lastError: unknown;

  for (;;) {
    attempts += 1;

    try {
      // The mint is inside the try on purpose: while middleware is restarting,
      // the API session can be the thing that is not back yet, and that is one
      // failed attempt like any other rather than the end of the loop.
      const token = await generateAuthToken(client);

      // Both waits are bounded by what is left of the budget, measured just
      // before each: the mint and the navigation can eat it on their own, and a
      // navigation that connects but never finishes loading is exactly the
      // pool-export case this loop exists for. Playwright reads `timeout: 0` as
      // *no* timeout, so a spent budget has to stop the attempt here rather than
      // be clamped to zero and wait for the per-test ceiling instead.
      await page.goto(buildTokenLoginUrl(config.uiBaseUrl, token), { timeout: remainingOf(deadline) });
      await expect(page.locator(adminLayout)).toBeVisible({ timeout: remainingOf(deadline) });
      return;
    } catch (error) {
      // `goto` can throw outright while the web server is down, and the
      // assertion throws when it is up but the app has not rendered; both mean
      // "not yet", and both are worth another navigation.
      lastError = error;
    }

    if (Date.now() + tokenLoginRetryDelayMs >= deadline) {
      break;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, tokenLoginRetryDelayMs);
    });
  }

  throw new Error(
    `Token login did not reach the admin shell within ${tokenLoginBudgetMs / 1000}s (${attempts} `
    + 'attempts, each with a freshly minted token). A pool export or import just before this test '
    + 'would explain a UI that is still coming back. '
    + `Last attempt: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    { cause: lastError },
  );
}

export interface E2eTestOptions {
  /**
   * Whether `page` is signed in before the test starts. On by default; the
   * `unauthenticated` project turns it off in `playwright.config.ts`, because
   * those tests cover sign-in itself and a bypass would defeat them (R4.2).
   */
  authenticate: boolean;
  /**
   * Whether `page` records the API calls it makes, for `apiCallsTo`. Off by
   * default; a spec that asserts a request was sent turns it on with
   * `test.use`. See `support/api-calls.ts`.
   */
  recordApiCalls: boolean;
}

interface E2eTestFixtures {
  /** Fails a test of a lane whose spec does not set `laneSpec` to its own name. */
  laneSpecCheck: void;
}

export interface E2eWorkerFixtures {
  /**
   * Whether this worker reaches the HA pair through its VIP rather than node A:
   * the UI served against the VIP, `api` connected to it, and sign-in through
   * it. Off by default; the HA journeys that run once the VIP exists turn it on
   * in `playwright.config.ts`. See `throughVip`.
   */
  haThroughVip: boolean;
  /**
   * Whether this worker shares the appliance with other workers or needs it to
   * itself. Exclusive by default, so a project that says nothing is safe; the
   * `parallel` and `data-protection` projects opt into `shared` in `playwright.config.ts`. See
   * `support/appliance-lock.ts`.
   */
  applianceAccess: ApplianceAccess;
  /** Held for the worker's life, before anything touches the appliance. */
  applianceLock: void;
  /**
   * A lane this worker takes turns in with every other worker of the same
   * lane: the `data-protection` project sets one. Undefined for none.
   *
   * The project's own one-worker limit already does this, except for the moment
   * Playwright briefly runs two of its workers — see the `serial` project in
   * `playwright.config.ts`.
   */
  applianceLane: string | undefined;
  /**
   * The spec's own name, set with `test.use` by every spec of a lane:
   *
   *     test.use({ laneSpec: 'rsync-task-run' });
   *
   * A worker-scoped option a spec sets gives that spec a worker of its own, so
   * the lane, held for the worker's life, covers exactly one spec file — its
   * `beforeAll` and `afterAll` included — and is let go as soon as the file is
   * done, because Playwright stops a worker nothing else queued can use. Held
   * by a worker shared between files, an idle holder would deadlock the lane:
   * the project's limit counts the worker waiting for it, so the holder could
   * take no more of the queue, nor stop while the queue was not empty.
   */
  laneSpec: string | undefined;
  /** Held for the worker's life, when it has a lane. */
  applianceLaneLock: void;
  /** Resolved target configuration for this run. */
  config: TargetConfig;
  /**
   * Connected, authenticated middleware client.
   *
   * Use it for preconditions, teardown and cross-checks — never to perform the
   * action under test. Driving the API to do the thing the test is about is the
   * difference between testing the UI and testing middleware.
   */
  api: E2eApiClient;
  /**
   * The name of an online pool for datasets to live under.
   *
   * An existing pool where the appliance has one; otherwise a one-disk pool
   * the suite builds and exports when the worker ends — unless the worker
   * shares the appliance, when another worker may still be using it. Worker-scoped so every
   * spec in a worker shares one build, and lazy so a spec that never asks for
   * a pool never builds one. Not for tests *about* pools — those drive the
   * wizard. See `fixtures/pool.ts`.
   */
  pool: string;
  /**
   * What the entitlement engine grants this appliance, for a journey that drives a control the
   * UI locks without the key. Read once per worker — it changes only with the licence.
   *
   * Ask with `isEntitled` and skip; see `fixtures/entitlements.ts`.
   */
  entitlements: EntitlementDecisions;
}

/**
 * Both fixtures are worker-scoped, not test-scoped.
 *
 * Each connection costs a sign-in, and middleware rate-limits *unauthenticated*
 * calls at 20 per method per IP per minute — so connections, not queries, are
 * the scarce resource. One per worker means a handful for the whole run, one
 * per `TN_WORKERS` and per worker restarted after a failure, rather than one per
 * spec file.
 *
 * Both are lazy in principle, but in practice every test in the authenticated
 * projects opens the socket: the `page` override below names `api` so it can
 * mint a login token. The `unauthenticated` project's `page` does not need it,
 * yet Playwright builds the fixture graph from the destructuring pattern rather
 * than from the branch taken, so its tests open the socket too — harmlessly,
 * since both of those specs use `api` for their own cleanup anyway. Should a
 * sign-in test ever need to run with middleware unreachable, the token would
 * have to move behind a fixture that project overrides.
 */
export const test = base.extend<E2eTestOptions & E2eTestFixtures, E2eWorkerFixtures>({
  authenticate: [true, { option: true }],
  recordApiCalls: [false, { option: true }],
  laneSpecCheck: [
    async ({ applianceLane, laneSpec }, use, testInfo) => {
      const spec = basename(testInfo.file, '.e2e.ts');
      if (applianceLane && laneSpec !== spec) {
        throw new Error(
          `${spec} runs in the "${applianceLane}" lane, so it needs \`test.use({ laneSpec: '${spec}' })\` `
          + 'at its top level, for a worker of its own. See `laneSpec` in e2e/support/fixtures.ts.',
        );
      }
      await use();
    },
    { auto: true },
  ],

  haThroughVip: [false, { option: true, scope: 'worker' }],

  applianceAccess: ['exclusive', { option: true, scope: 'worker' }],

  applianceLock: [
    async ({ applianceAccess }, use) => {
      const release = await acquireApplianceLock(applianceAccess);
      try {
        await use();
      } finally {
        release();
      }
    },
    // An exclusive worker waits for every parallel worker to finish, and the
    // two exclusive projects take turns — the wait is the serial half of the
    // run, not a hang, so the per-test ceiling is the wrong bound for it.
    { scope: 'worker', auto: true, timeout: lockWaitTimeoutMs },
  ],

  applianceLane: [undefined, { option: true, scope: 'worker' }],

  laneSpec: [undefined, { option: true, scope: 'worker' }],

  applianceLaneLock: [
    // After `applianceLock`, so a worker queues for its lane already holding its
    // share, and a serial spec cannot slip in between the two.
    async ({ applianceLane, applianceLock: _ }, use) => {
      if (!applianceLane) {
        await use();
        return;
      }
      await withRunMutex(`lane-${applianceLane}`, () => use());
    },
    { scope: 'worker', auto: true, timeout: lockWaitTimeoutMs },
  ],

  config: [
    async ({ haThroughVip }, use) => {
      const config = loadTargetConfig();
      await use(haThroughVip ? throughVip(config) : config);
    },
    { scope: 'worker' },
  ],

  api: [
    async ({ config }, use) => {
      const client = await connectAndLogin(config);
      // For `clearRateLimit`, which the `page` override calls before every test.
      enablePrivateMethods(client);
      try {
        await use(client);
      } finally {
        // Runs even when a test throws, so a failing run still exits cleanly.
        client.close();
      }
    },
    { scope: 'worker' },
  ],

  entitlements: [
    async ({ api }, use) => {
      await use(await readEntitlements(api));
    },
    { scope: 'worker' },
  ],

  pool: [
    async ({ api, applianceAccess }, use) => {
      const lifecycle = poolLifecycle();
      if (applianceAccess === 'shared') {
        // Parallel workers start together, and each would find no pool and
        // build one. One builds it; the rest find it. None exports it, since
        // the others may still have datasets on it: `support/global-teardown.ts`
        // does, once every worker has stopped.
        const name = await withRunMutex('pool', () => lifecycle.provide(api));
        if (name === suiteOwnedPoolName) {
          markSharedPoolUsed();
        }
        await use(name);
        return;
      }

      // `provide` is inside the try on purpose: it records responsibility for
      // the pool *before* starting `pool.create`, so a build that lands and
      // then times out or loses its socket must still reach `release`.
      try {
        await use(await lifecycle.provide(api));
      } finally {
        await lifecycle.release(api, keepTestData);
      }
    },
    { scope: 'worker' },
  ],

  /**
   * Signs the page in through the token URL before each authenticated test.
   *
   * Per test, not once via `storageState`, because of what the app does with a
   * token once it has redeemed it. webui keeps its session token in
   * `localStorage` and replaces it after every login with a five-minute,
   * single-use reconnect token of its own (`auth.service.ts`). A `storageState`
   * captured after the setup login is therefore a snapshot of *that* token, not
   * of the two-hour one that was redeemed — so it works for exactly one test,
   * started within five minutes, and every later test lands on the sign-in
   * page. The suite never noticed while it had a single authenticated test; the
   * S3 journeys were the first pair to run back to back.
   *
   * The token URL is the same entry the setup project validates, and a login
   * costs a few seconds — well under the fifteen the form takes, which is the
   * cost the token exists to avoid (R4.1). See `signInWithToken` for why each
   * login also gets its own token.
   *
   * It also records what the test exercised for `yarn e2e:coverage`, counting
   * from the test's first navigation or user input so that the sign-in and the
   * dashboard it lands on are not credited to every test. See
   * `support/coverage.ts`.
   */
  page: async ({
    page, authenticate, recordApiCalls: recording, api, config,
  }, use, testInfo) => {
    // First, so this test's sign-in and any reloads it makes start from an empty
    // rate-limit budget, whatever the tests before it spent. For the
    // unauthenticated project too: its sign-ins go through the same sign-in page,
    // and its password logins through `auth.login_ex`. See `support/api/rate-limit.ts`.
    await clearRateLimit(api);

    const coverage = new CoverageRecorder(page, config.uiBaseUrl);
    await coverage.attach();

    // Registered before the sign-in, because the sign-in is where it first bites.
    await dismissConcurrencyDialogs(page);
    // Before the sign-in too: that is where the socket opens.
    if (recording) {
      recordApiCalls(page);
    }

    if (authenticate) {
      await signInWithToken(page, api, config);
    }
    coverage.start();
    try {
      await use(page);
    } finally {
      await coverage.save(testInfo);
    }
  },
});

export { expect } from '@playwright/test';
