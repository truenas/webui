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
 * shell, on the Dashboard — usually the page the previous test left signed in.
 * See the `page` override below for why.
 */
import {
  expect, type Page, test as base, type ViewportSize,
} from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { recordApiCalls } from './api-calls';
import { buildTokenLoginUrl, generateAuthToken } from './auth/token';
import { keepTestData } from './cleanup';
import { loadTargetConfig, type TargetConfig, throughVip } from './config';
import {
  adminLayout, concurrentCallsDialogTitleId, errorDialog, errorDialogClose,
} from './constants';
import { type EntitlementDecisions, readEntitlements } from '../fixtures/entitlements';
import { poolLifecycle } from '../fixtures/pool';
import { navLocators } from '../locators/navigation';

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
  //
  // Removed first, so a page kept across tests (`sessionPage`) gets the cap per
  // test rather than one cap for the whole worker.
  await page.removeLocatorHandler(concurrencyDialog);
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

/** How long tidying a kept page may take before it is given up for a fresh sign-in. */
const resumeTimeoutMs = 5_000;

/**
 * Takes a page kept from the last test back to the Dashboard, the way a user
 * would: Escape out of whatever was left open, then the sidebar's Dashboard.
 * True when that worked; false when the page needs a fresh sign-in instead.
 *
 * Anything short of a clean arrival is false, and none of it is an error: a
 * page never signed in, a shell gone (signed out, the socket lost to a
 * middleware restart), an error dialog, a side panel whose unsaved changes
 * veto Escape and whose backdrop then takes the click, a guard that holds the
 * route. Each costs one fresh sign-in, which is all every test cost before.
 */
async function resumeSession(page: Page): Promise<boolean> {
  if (!page.url().startsWith('http')) {
    return false;
  }

  try {
    // A menu, a dialog, a side panel and the confirmation a dirty one raises
    // are each one Escape; three covers a panel's guard and the panel.
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press('Escape');
    }

    if (!await page.locator(adminLayout).isVisible() || await page.locator(errorDialog).isVisible()) {
      return false;
    }

    // A click on the route already open does not open it again, and the Dashboard would keep
    // what the last test left on it: run 39131873795's `dashboard.e2e.ts` found the layout
    // `dashboard-widgets` had written and since put back over the API. So it is left first.
    if (/\/dashboard\/?$/.test(page.url())) {
      await page.locator(navLocators.dataProtection).filter({ visible: true }).first()
        .click({ timeout: resumeTimeoutMs });
      await expect(page).not.toHaveURL(/\/dashboard\/?$/, { timeout: resumeTimeoutMs });
    }

    await page.locator(navLocators.dashboard).filter({ visible: true }).first().click({ timeout: resumeTimeoutMs });
    await expect(page).toHaveURL(/\/dashboard\/?$/, { timeout: resumeTimeoutMs });
    return true;
  } catch {
    return false;
  }
}

/** A test that sets its own viewport needs a context made with it. */
function isProjectViewport(viewport: ViewportSize | null, projectViewport: ViewportSize | null | undefined): boolean {
  return JSON.stringify(viewport) === JSON.stringify(projectViewport ?? null);
}

export interface E2eTestOptions {
  /**
   * Whether `page` is signed in before the test starts. On by default; the
   * `unauthenticated` project turns it off in `playwright.config.ts`, because
   * those tests cover sign-in itself and a bypass would defeat them (R4.2).
   */
  authenticate: boolean;
  /**
   * Whether an authenticated test may run in the page the last one left signed
   * in, rather than a fresh one signed in for it. On by default; the HA
   * projects turn it off. See the `page` override for when it is not used
   * regardless.
   */
  sharedSession: boolean;
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
   * The worker's kept page, for the `page` override. Made on first use, so a
   * worker whose tests all need a fresh page never opens it, and closed with
   * the worker — which Playwright replaces after any failure, so a test that
   * breaks the page cannot hand it on.
   */
  sessionPage: { get: () => Promise<Page> };
}

/**
 * Both fixtures are worker-scoped, not test-scoped.
 *
 * Each connection costs a sign-in, and middleware rate-limits *unauthenticated*
 * calls at 20 per method per IP per minute — so connections, not queries, are
 * the scarce resource. One per worker means one for the whole run at the
 * current `workers: 1`, rather than one per spec file.
 *
 * Both are lazy in principle, but in practice every test in the `authenticated`
 * project opens the socket: the `page` override below names `api` so it can
 * mint a login token. The `unauthenticated` project's `page` does not need it,
 * yet Playwright builds the fixture graph from the destructuring pattern rather
 * than from the branch taken, so its tests open the socket too — harmlessly,
 * since both of those specs use `api` for their own cleanup anyway. Should a
 * sign-in test ever need to run with middleware unreachable, the token would
 * have to move behind a fixture that project overrides.
 */
export const test = base.extend<E2eTestOptions, E2eWorkerFixtures>({
  authenticate: [true, { option: true }],
  sharedSession: [true, { option: true }],
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
   * An authenticated test's page: the one the last test left signed in, taken
   * back to the Dashboard, or else one signed in through the token URL.
   *
   * Kept across tests because every page load spends unauthenticated calls —
   * the token login and the sign-in page's own checks — and middleware allows
   * each of those 20 per minute per IP. Signing in per test spent them at the
   * suite's pace: a run of short specs passed 20 a minute, and whichever test
   * came next met `[EBUSY] Rate Limit Exceeded` on the sign-in page (three of
   * four full runs, 2026-10-17/18). A kept page loads once per worker, and
   * again only for a test that reloads or one whose page the last left broken.
   *
   * What a kept page carries over is what a user's session would: the app's
   * state from the previous journey. A test whose claim depends on a fresh
   * load says so with `test.use({ sharedSession: false })`, or reloads.
   *
   * When it is signed in afresh, it is through the token URL, not once via
   * `storageState`, because of what the app does with a
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
   */
  page: async ({
    context, authenticate, sharedSession, recordApiCalls: recording, viewport, sessionPage, api, config,
  }, use, testInfo) => {
    // A fresh page, signed in for this test alone, wherever a kept one would not
    // do: signed out on purpose; calls recorded, which needs the socket watched
    // from when it opens; a viewport of its own; or a retry, which should start
    // from nothing the failed attempt could have left.
    const keepsPage = authenticate && sharedSession && !recording && testInfo.retry === 0
      && isProjectViewport(viewport, testInfo.project.use.viewport);

    if (!keepsPage) {
      const page = await context.newPage();
      // Registered before the sign-in, because the sign-in is where it first bites.
      await dismissConcurrencyDialogs(page);
      // Before the sign-in too: that is where the socket opens.
      if (recording) {
        recordApiCalls(page);
      }

      if (authenticate) {
        await signInWithToken(page, api, config);
      }
      await use(page);
      return;
    }

    const page = await sessionPage.get();
    await dismissConcurrencyDialogs(page);
    const resumed = await resumeSession(page);
    if (!resumed) {
      await signInWithToken(page, api, config);
    }
    // Which it was, in the report and the JUnit file: how often a kept page has
    // to be signed in again is what says whether keeping it pays.
    testInfo.annotations.push({ type: 'session', description: resumed ? 'kept' : 'signed in' });
    await use(page);
    // Granted per test (the clipboard, in `dashboard-links`), so taken back per test.
    await page.context().clearPermissions();
  },

  sessionPage: [
    async ({ browser }, use) => {
      let page: Page | undefined;
      await use({
        get: async () => {
          if (!page || page.isClosed()) {
            // Made from inside a test, where Playwright's own context options —
            // base URL, certificates, viewport, action timeout — are in force for
            // `newContext`, as they are for the context it makes itself.
            page = await (await browser.newContext()).newPage();
          }
          return page;
        },
      });
      await page?.context().close();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
