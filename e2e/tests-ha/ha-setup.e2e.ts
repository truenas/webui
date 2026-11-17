/**
 * Stories: an admin sets HA up on a licensed pair (failover off, data interface addresses and VIP, a pool,
 * config synced to the standby, failover on) and the pair ends healthy with controller 1 active. Sync comes
 * after the pool so the standby restarts onto a complete config. Serial, a link in the HA chain
 * (`playwright.config.ts`): a failure stops the rest. All via controller 1's address (no VIP until the second
 * test); each step is also checked over the API, where the standby's problems show in `failover.disabled.reasons`.
 */
import {
  dropsDhcpGateway, findInterfaceWith, isFailoverEnabled, poolNames, readFailover, readHaInterface, readPeerBootId,
  requireHa,
} from '../fixtures/ha';
import {
  openFailoverForm, openInterfaceForm, saveAutomaticFailover, saveInterface, setHaAddresses, syncToPeer,
  testAndSaveNetworkChanges,
} from '../flows/ha';
import {
  configureAutomatedVdevs, goToReview, openPoolWizard, submitPool,
} from '../flows/storage';
import { haStatusLocators } from '../locators/ha';
import { expect, test } from '../support/fixtures';

test.describe.configure({ mode: 'serial' });

/** The pool the pair fails over. One shared disk is enough for that. */
const pool = 'tank';

/** The failover group the data interface is critical in. */
const failoverGroup = 1;

/**
 * Turning failover on brings HA up only once the standby, rebooted by the
 * sync, is back and has caught up: minutes on these VMs.
 */
const haUpTimeoutMs = 10 * 60_000;

/** What controller 1 reports while controller 2 is not back from a reboot, or not yet in step. */
const peerNotBackReasons = ['NO_PONG', 'NO_SYSTEM_READY', 'NO_JOURNAL_SYNC', 'REM_NO_JOURNAL_SYNC'];

test('an admin turns automatic failover off while the pair is set up', async ({ page, api, config }) => {
  requireHa(config);

  await openFailoverForm(page, true);
  await saveAutomaticFailover(page, false);

  expect(await isFailoverEnabled(api)).toBe(false);
});

test('an admin gives the data interface both controllers\' addresses and a virtual IP', async ({
  page, api, config,
}) => {
  const ha = requireHa(config);
  const name = await findInterfaceWith(api, ha.nodeA);
  const keepsGateway = await dropsDhcpGateway(api);

  await openInterfaceForm(page, name);
  await setHaAddresses(page, {
    address: ha.nodeA, netmask: ha.netmask, failoverAddress: ha.nodeB, vip: ha.vip,
  }, failoverGroup);
  await saveInterface(page, keepsGateway);
  await testAndSaveNetworkChanges(page);

  expect(await readHaInterface(api, name)).toEqual({
    dhcp: false,
    aliases: [`${ha.nodeA}/${ha.netmask}`],
    failoverAliases: [ha.nodeB],
    virtualAliases: [ha.vip],
    critical: true,
    group: failoverGroup,
  });
});

test('an admin creates the pool the pair will fail over', async ({ page, api, config }) => {
  requireHa(config);

  await openPoolWizard(page, pool);
  await configureAutomatedVdevs(page, 'data', { layout: 'Stripe', width: 1, vdevs: 1 });
  await goToReview(page, 'data');
  await submitPool(page);

  expect(await poolNames(api)).toContain(pool);
});

test('an admin syncs the configuration onto the standby, which restarts onto it', async ({ page, api, config }) => {
  requireHa(config);

  const bootBeforeSync = await readPeerBootId(api);
  expect(bootBeforeSync, 'controller 1 reaches controller 2').not.toBeNull();

  await openFailoverForm(page, true);
  await syncToPeer(page, true);
  // Closes the form with failover still off, as it was.
  await saveAutomaticFailover(page, false);

  // With a VIP configured, the pair is no longer SINGLE: controller 1 holds the VIP.
  await expect.poll(async () => (await readFailover(api)).status).toBe('MASTER');

  // Controller 2 rebooted onto the synced configuration and is back, before
  // failover is turned on: controller 1 sends each later change to it as it
  // is made, and one made while it is down never reaches it. A pool and
  // failover turned on while it rebooted left it with failover off and no
  // pool, so it never took over.
  await expect.poll(async () => {
    const bootId = await readPeerBootId(api);
    const { reasons } = await readFailover(api);
    return bootId !== null && bootId !== bootBeforeSync
      && !reasons.some((reason) => peerNotBackReasons.includes(reason));
  }, { timeout: haUpTimeoutMs, intervals: [5_000] }).toBe(true);
});

test('an admin turns automatic failover on, and HA comes up', async ({ page, api, config }) => {
  requireHa(config);

  await openFailoverForm(page, true);
  await saveAutomaticFailover(page, true);

  // Up once nothing is left in the reasons HA is off: the standby back from
  // the restart the sync gave it, licensed, in step, and fenced holding the
  // pool's disks. Asked of middleware first, because on the way the reasons
  // pass through states the topbar shows as reconnecting.
  await expect.poll(async () => readFailover(api), { timeout: haUpTimeoutMs, intervals: [5_000] }).toEqual({
    licensed: true, status: 'MASTER', node: 'A', reasons: [],
  });
  await expect(page.locator(haStatusLocators.indicatorEnabled)).toBeVisible();
});
