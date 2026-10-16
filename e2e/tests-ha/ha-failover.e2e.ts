/**
 * Story: an admin fails the pair over from the Dashboard, and controller 2
 * takes over: the app rides out the switch, signs in again through the VIP,
 * and finds controller 2 active with controller 1 back as its standby.
 *
 * The last link of the HA suite's chain (`playwright.config.ts`), after
 * `ha-setup` left HA up with controller 1 active. Its project reaches the
 * pair through the VIP (`haThroughVip`), as a user does: the UI, sign-in and
 * `api` all go to whichever controller holds it. `api` is connected to
 * controller 1, though, and the failover takes the VIP — and that socket —
 * away from it, so everything after the failover asks a fresh connection.
 */
import { readFailover, requireHa } from '../fixtures/ha';
import { awaitAdminShell, submitSignIn } from '../flows/auth';
import { initiateFailover } from '../flows/ha';
import { haStatusLocators } from '../locators/ha';
import { withClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/** Controller 1 reboots out of the way; controller 2 imports the pool and takes the VIP. */
const failoverTimeoutMs = 5 * 60_000;

/** Controller 1 back from its reboot as the standby, and HA healthy again. */
const haBackTimeoutMs = 10 * 60_000;

test('an admin fails the pair over to controller 2, and HA comes back with controller 1 standing by', async ({
  page, api, config,
}) => {
  requireHa(config);

  expect(await readFailover(api), 'controller 1 active, HA healthy').toEqual({
    licensed: true, status: 'MASTER', node: 'A', reasons: [],
  });

  await initiateFailover(page);

  // The app's own splash while the controller it talks to steps down, then
  // the sign-in page once the VIP answers again, from controller 2.
  await expect(page.locator(haStatusLocators.systemTaskMessage)).toBeVisible();
  await submitSignIn(page, config.username, config.password);
  await awaitAdminShell(page, config.username);

  await expect.poll(
    () => withClient(config, async (client) => (await readFailover(client)).node),
    { timeout: failoverTimeoutMs },
  ).toBe('B');

  // Once controller 1 is back, as the standby, nothing is left in the
  // reasons HA is off — asked of middleware first, for the reason ha-setup
  // gives — and the topbar says so.
  await expect.poll(() => withClient(config, readFailover), { timeout: haBackTimeoutMs, intervals: [5_000] }).toEqual({
    licensed: true, status: 'MASTER', node: 'B', reasons: [],
  });
  await expect(page.locator(haStatusLocators.indicatorEnabled)).toBeVisible();
});
