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
 */
import { test as base } from '@playwright/test';
import type { E2eApiClient } from './api/client';
import { connectAndLogin } from './api/client';
import { loadTargetConfig, type TargetConfig } from './config';

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
export const test = base.extend<Record<never, never>, E2eWorkerFixtures>({
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
});

export { expect } from '@playwright/test';
