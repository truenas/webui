/**
 * Stories: an admin builds a VLAN, a bridge and a failover LAGG on a spare NIC,
 * applies each one with Test Changes and keeps it with Save Changes, and then
 * deletes a VLAN the same way.
 *
 * Commit and check-in are the safety net that rolls a bad network change back
 * by itself, and a regression there is how an admin locks themselves out.
 * `network-interfaces-staging.e2e.ts` stages and reverts; this file is the one
 * that applies.
 *
 * **It needs a spare NIC**, named by its MAC in `TN_SPARE_NICS`, and skips
 * without one. A commit re-applies every interface, and anything built on the
 * NIC the suite talks to could take its address away. The spare has no address,
 * no DHCP and no peer, and everything here is built on it. Every address is in
 * TEST-NET-1, so nothing can route anywhere real.
 *
 * Before anything commits, the management NIC is saved to the database as DHCP,
 * as it already runs: once the table holds any row, middleware unconfigures
 * every NIC without one. See `pinManagementInterface`. That row is removed
 * again at the end.
 *
 * Serial: commit and check-in are global, and every test reuses the same spare
 * NIC.
 */
import {
  commitInterfaceChanges, ensureNoPendingInterfaceChanges, ensureNothingOnSpareInterface, findInterface,
  findManagementInterface, findSpareInterface, hasInterfaceRow, hasNetworkConfigToBeRemoved,
  hasPendingInterfaceChanges, type InterfaceRecord, type ManagementInterface, pinManagementInterface,
  readCheckinWaiting, readIpv4Addresses, stageVlan, unpinManagementInterface,
} from '../fixtures/interfaces';
import { goToNetwork } from '../flows/navigation';
import {
  addBridge, addFailoverLagg, addVlan, answerGatewayDialog, chooseInterfaceType, deleteInterfaceFromCard,
  openAddInterfaceForm, saveNetworkChanges, type StaticAddress, testNetworkChanges,
} from '../flows/network-interfaces';
import { interfacesCardLocators, pendingChangesLocators } from '../locators/network-interfaces';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** `TN_SPARE_NICS` is a comma-separated list of MACs. One is enough here. */
const spareMac = process.env.TN_SPARE_NICS?.split(',')[0]?.trim() ?? '';

/** The page's own default, and well above the 10 s it refuses below. */
const checkinTimeoutSeconds = 60;

/** A commit applies the address before it answers, but the kernel's view can trail by a moment. */
const appliedTimeoutMs = 15_000;

const vlanName = 'vlan200';
const vlanTag = 200;
const vlanAlias: StaticAddress = { address: '192.0.2.200', netmask: 24 };
const bridgeAlias: StaticAddress = { address: '192.0.2.201', netmask: 24 };
const bridgeDescription = 'e2e committed bridge';

const card = interfacesCardLocators;
const pending = pendingChangesLocators;

let management: ManagementInterface;
let spare: InterfaceRecord;
let pinnedManagement = false;

/** `state.aliases` addresses of `name`, as applied: what Save Changes made permanent. */
async function readAppliedAddresses(api: E2eApiClient, name: string): Promise<string[]> {
  const entry = await findInterface(api, name);

  return entry?.state.aliases.map((alias) => alias.address) ?? [];
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ api }) => {
  // Without a NIC nothing else uses, a commit could cut the suite off from the appliance.
  test.skip(!spareMac, 'TN_SPARE_NICS is unset, so there is no spare NIC to commit interface changes on.');

  const found = await findSpareInterface(api, spareMac);
  if (!found) {
    // A MAC that matches no NIC means the boot step did not attach it.
    test.skip(true, `TN_SPARE_NICS names ${spareMac}, and no physical NIC has that MAC.`);
    return;
  }
  spare = found;

  management = await findManagementInterface(api);
  if (management.name === spare.name) {
    throw new Error(`TN_SPARE_NICS names ${spare.name}, the NIC the suite talks to. It must name a spare.`);
  }

  await ensureNoPendingInterfaceChanges(api);
  // Before anything on the spare is committed away, which with no management row would unconfigure it.
  // Recorded before the pin, which can throw once its row has landed, so afterAll still removes it.
  pinnedManagement = !await hasInterfaceRow(api, management.name);
  if (pinnedManagement) {
    await pinManagementInterface(api, management.name);
  }

  // The pin must not have moved the management NIC: everything after it depends on that address.
  expect(await readIpv4Addresses(api, management.name)).toEqual(management.ipv4Addresses);
});

test.beforeEach(async ({ api }) => {
  await ensureNothingOnSpareInterface(api, spare.name);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`every interface built on ${spare.name}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove every interface built on ${spare.name}, and commit`, () => ensureNothingOnSpareInterface(api, spare.name)],
  ]);
});

test.afterAll(async ({ api }) => {
  if (!pinnedManagement || leavingTestData(`the DHCP row for ${management.name} in network.interfaces`)) {
    return;
  }

  // The spare first, and the unpin only if that worked: a row left in the table once the management
  // row goes would unconfigure the management NIC. A pin left in place is the safe failure.
  await ensureNothingOnSpareInterface(api, spare.name);
  await unpinManagementInterface(api, management.name);

  // Middleware runs DHCP on every NIC again, and qemu hands out the same lease.
  await expect.poll(
    () => readIpv4Addresses(api, management.name),
    { message: `${management.name} should get its lease back`, timeout: 60_000 },
  ).toEqual(management.ipv4Addresses);
});

test('an admin adds a VLAN on the spare NIC, tests it and saves it', async ({ page, api }) => {
  await openAddInterfaceForm(page);
  await addVlan(page, {
    name: vlanName,
    description: '',
    parent: spare.name,
    tag: vlanTag,
    alias: vlanAlias,
  });
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));
  await expect(page.locator(card.row(vlanName))).toBeVisible();

  await testNetworkChanges(page, checkinTimeoutSeconds);

  // Waiting for its check-in, and counting down to the automatic rollback.
  const remaining = page.locator(pending.checkinRemaining);
  await expect(remaining).toBeVisible();
  const firstReading = await remaining.textContent();
  await expect(remaining).not.toHaveText(firstReading ?? '');
  await expect(page.locator(pending.testChanges)).toHaveCount(0);
  expect(await readCheckinWaiting(api)).not.toBeNull();

  await saveNetworkChanges(page);

  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await readCheckinWaiting(api)).toBeNull();
  expect(await findInterface(api, vlanName)).toMatchObject({
    type: 'VLAN',
    vlan_parent_interface: spare.name,
    vlan_tag: vlanTag,
    aliases: [{ address: vlanAlias.address, netmask: vlanAlias.netmask }],
  });
  await expect.poll(() => readAppliedAddresses(api, vlanName), { timeout: appliedTimeoutMs })
    .toContain(vlanAlias.address);
  expect(await readIpv4Addresses(api, management.name)).toEqual(management.ipv4Addresses);
});

test('an admin adds a bridge over the spare NIC, tests it and saves it', async ({ page, api }) => {
  await openAddInterfaceForm(page);
  const bridgeName = await chooseInterfaceType(page, 'Bridge');
  await addBridge(page, { description: bridgeDescription, members: [spare.name], alias: bridgeAlias });
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));
  await expect(page.locator(card.row(bridgeName))).toBeVisible();

  await testNetworkChanges(page, checkinTimeoutSeconds);
  await saveNetworkChanges(page);

  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await findInterface(api, bridgeName)).toMatchObject({
    type: 'BRIDGE',
    description: bridgeDescription,
    bridge_members: [spare.name],
  });
  await expect.poll(() => readAppliedAddresses(api, bridgeName), { timeout: appliedTimeoutMs })
    .toContain(bridgeAlias.address);
  expect(await readIpv4Addresses(api, management.name)).toEqual(management.ipv4Addresses);
});

/*
 * One port: middleware refuses only an empty `lag_ports`, and the form sets no
 * minimum. With nothing on the other end of the spare, the claim is the stored
 * configuration, not a working bond.
 */
test('an admin adds a failover LAGG over the spare NIC, tests it and saves it', async ({ page, api }) => {
  await openAddInterfaceForm(page);
  const lagName = await chooseInterfaceType(page, 'Link Aggregation');
  await addFailoverLagg(page, [spare.name]);
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));
  await expect(page.locator(card.row(lagName))).toBeVisible();

  await testNetworkChanges(page, checkinTimeoutSeconds);
  await saveNetworkChanges(page);

  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await findInterface(api, lagName)).toMatchObject({
    type: 'LINK_AGGREGATION',
    lag_protocol: 'FAILOVER',
    lag_ports: [spare.name],
  });
  expect(await readIpv4Addresses(api, management.name)).toEqual(management.ipv4Addresses);
});

test('an admin deletes a committed VLAN from the card, tests it and saves it', async ({ page, api }) => {
  await stageVlan(api, { name: vlanName, parent: spare.name, tag: vlanTag });
  await commitInterfaceChanges(api, `${vlanName} was never applied, so deleting it tests nothing.`);
  expect(await findInterface(api, vlanName)).toBeDefined();

  await goToNetwork(page);
  await deleteInterfaceFromCard(page, vlanName);
  await expect(page.locator(pending.testChanges)).toBeVisible();

  await testNetworkChanges(page, checkinTimeoutSeconds);
  await saveNetworkChanges(page);

  await expect(page.locator(card.row(vlanName))).toBeHidden();
  expect(await findInterface(api, vlanName)).toBeUndefined();
  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await readIpv4Addresses(api, management.name)).toEqual(management.ipv4Addresses);
});
