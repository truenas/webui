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
import { expect, test as base } from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { buildTokenLoginUrl, generateAuthToken } from './auth/token';
import { loadTargetConfig, type TargetConfig } from './config';
import { adminLayout } from './constants';

/** How long the app gets to redeem the token and render the shell. */
const tokenLoginTimeoutMs = 60_000;

/**
 * One login token per worker, minted on first use.
 *
 * Keyed on the client rather than declared as a worker fixture the `page`
 * override depends on: Playwright builds the fixture graph from what a fixture
 * destructures, not from which branches read it, so a worker fixture named in
 * `page`'s signature would be instantiated for every test — including the
 * `unauthenticated` project, whose whole point is to keep running when token
 * login is broken (R4.2). Minting lazily inside the `authenticate` branch keeps
 * that project free of the call.
 */
const tokensByClient = new WeakMap<E2eApiClient, Promise<string>>();

function authTokenFor(client: E2eApiClient): Promise<string> {
  let token = tokensByClient.get(client);
  if (!token) {
    token = generateAuthToken(client);
    tokensByClient.set(client, token);
  }
  return token;
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
   * A reusable login token for this worker — two hours, not single-use, not
   * origin-bound (see `auth/token.ts`). The same one the `page` fixture signs
   * in with; a test that needs the raw token (a URL to hand to something else)
   * asks for it here, and the mint happens once either way.
   */
  authToken: string;
}

/**
 * Both fixtures are worker-scoped, not test-scoped.
 *
 * Each connection costs a sign-in, and middleware rate-limits *unauthenticated*
 * calls at 20 per method per IP per minute — so connections, not queries, are
 * the scarce resource. One per worker means one for the whole run at the
 * current `workers: 1`, rather than one per spec file.
 *
 * They are also lazy: a spec that never asks for `api` never opens a socket.
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

  authToken: [
    async ({ api }, use) => {
      await use(await authTokenFor(api));
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
   * cost the token exists to avoid (R4.1).
   */
  page: async ({
    page, authenticate, api, config,
  }, use) => {
    if (authenticate) {
      await page.goto(buildTokenLoginUrl(config.uiBaseUrl, await authTokenFor(api)));
      await expect(page.locator(adminLayout)).toBeVisible({ timeout: tokenLoginTimeoutMs });
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
