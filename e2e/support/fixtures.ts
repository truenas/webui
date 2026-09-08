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
import { expect, type Page, test as base } from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { buildTokenLoginUrl, generateAuthToken } from './auth/token';
import { keepTestData } from './cleanup';
import { loadTargetConfig, type TargetConfig } from './config';
import { adminLayout } from './constants';
import { poolLifecycle } from '../fixtures/pool';

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
      await page.goto(buildTokenLoginUrl(config.uiBaseUrl, token));

      // Measured after the mint and the navigation, which can eat the budget
      // on their own. Playwright reads `timeout: 0` as *no* timeout, so a spent
      // budget has to stop the attempt here rather than be clamped to zero and
      // wait for the per-test ceiling instead.
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw new Error('the login budget ran out before the admin shell could be awaited');
      }
      await expect(page.locator(adminLayout)).toBeVisible({
        timeout: Math.min(tokenLoginAttemptTimeoutMs, remainingMs),
      });
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
}

export interface E2eWorkerFixtures {
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

  config: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(loadTargetConfig());
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
   */
  page: async ({
    page, authenticate, api, config,
  }, use) => {
    if (authenticate) {
      await signInWithToken(page, api, config);
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
