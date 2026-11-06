/**
 * The suite's `test` object; import this instead of `@playwright/test`. It provides a connected middleware
 * client as a worker fixture, so no spec wires one up by hand and forgets the `afterAll` close that otherwise
 * hangs the runner after a green run. It also signs the browser in: with `authenticate` on (the default),
 * `page` starts inside the admin shell; see the `page` override for why that's per test, not `storageState`.
 */
import { expect, type Page, test as base } from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { clearRateLimit, enablePrivateMethods } from './api/rate-limit';
import { recordApiCalls } from './api-calls';
import { buildTokenLoginUrl, generateAuthToken } from './auth/token';
import { keepTestData } from './cleanup';
import { loadTargetConfig, type TargetConfig, throughVip } from './config';
import {
  adminLayout, concurrentCallsDialogTitleId, errorDialog, errorDialogClose,
} from './constants';
import { CoverageRecorder } from './coverage';
import { type SharedAppsPool, sharedAppsPool } from '../fixtures/apps';
import { type EntitlementDecisions, readEntitlements } from '../fixtures/entitlements';
import { poolLifecycle } from '../fixtures/pool';

/**
 * The sign-in wall-clock budget, one attempt's wait for the shell, and the pause between attempts. A budget,
 * not an attempt count: a down server fails `page.goto` in milliseconds while an unrendered app waits the full
 * timeout. Re-navigating matters because exporting or importing the system-dataset pool restarts services
 * and leaves the token URL unusable for a while, which a single long wait never recovers from.
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
 * `authenticated` project enters by token URL onto `/dashboard`, not the form.
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
 * Signs `page` in through the token URL with a token minted for this login. Per login, not per worker:
 * middleware stops honouring a token once the session that redeemed it is gone, so reuse makes the second test
 * in a worker time out (seen in CI on 2026-09-08). Minting is one rate-limit-exempt call. It's minted inside
 * the `authenticate` branch, not a fixture, because a fixture in `page`'s signature would also run for the
 * `unauthenticated` project, which must keep working when token login is broken (R4.2).
 */
/**
 * Resolves on the first animation frame the admin shell is rendered in.
 *
 * A wait, not the check: `signInWithToken` still asserts the shell visible after it, which then
 * passes on its first look. On its own, `toBeVisible` looks again only after 100, 250, 500 and
 * then every 1000ms, and the shell appears a second or so into the navigation: traces had it on
 * screen for up to 800ms before the assertion noticed, on every test's sign-in. Checking every
 * frame costs a `querySelector` and a rect per frame for about a second.
 */
async function waitForAdminShell(page: Page, timeout: number): Promise<void> {
  await page.waitForFunction((selector) => {
    const shell = document.querySelector(selector);
    if (!shell?.checkVisibility()) {
      return false;
    }
    const { width, height } = shell.getBoundingClientRect();
    return width > 0 && height > 0;
  }, adminLayout, { polling: 'raf', timeout });
}

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
      await waitForAdminShell(page, remainingOf(deadline));
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

export interface E2eWorkerFixtures {
  /**
   * Whether this worker reaches the HA pair through its VIP rather than node A:
   * the UI served against the VIP, `api` connected to it, and sign-in through
   * it. Off by default; the HA journeys that run once the VIP exists turn it on
   * in `playwright.config.ts`. See `throughVip`.
   */
  haThroughVip: boolean;
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
   * the suite builds and exports when the worker ends. Worker-scoped so every
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
  /**
   * `e2e_apps`, given to Apps once for all the apps specs in a worker: each calls `ensure()` in its
   * `beforeAll`, and the worker releases it when it ends. Building it and taking it down again costs
   * about 20 seconds of pool and Docker jobs, which every apps spec used to pay.
   *
   * The apps specs run in a project of their own, the `apps` one in `playwright.config.ts`, so their
   * worker ends when they do and no other spec runs beside Docker on a pool it did not ask for.
   */
  appsPool: SharedAppsPool;
}

/**
 * Both fixtures are worker-scoped: each connection costs a sign-in against the unauthenticated rate limit
 * (20 per method per IP per minute), so connections are the scarce resource. In practice every test opens
 * the socket, since `page` names `api` to mint a token and Playwright builds the fixture graph from the
 * destructuring, not the branch taken. A sign-in test that must run with middleware unreachable would need
 * the token behind a fixture that project overrides.
 */
export const test = base.extend<E2eTestOptions, E2eWorkerFixtures>({
  authenticate: [true, { option: true }],
  recordApiCalls: [false, { option: true }],

  haThroughVip: [false, { option: true, scope: 'worker' }],

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

  appsPool: [
    async ({ api }, use) => {
      const shared = sharedAppsPool(api);
      try {
        await use(shared);
      } finally {
        await shared.release({ keep: keepTestData });
      }
    },
    { scope: 'worker' },
  ],

  pool: [
    async ({ api }, use) => {
      const lifecycle = poolLifecycle();
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
   * Signs the page in through the token URL before each authenticated test. Per test, not via `storageState`:
   * webui replaces the redeemed token with a five-minute single-use reconnect token (`auth.service.ts`), so a
   * saved state works for one test only. A token login takes a few seconds versus fifteen for the form (R4.1);
   * see `signInWithToken` for why each login mints its own. It also records coverage for `yarn e2e:coverage`
   * from the test's first navigation or input (`support/coverage.ts`).
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
