/**
 * Stories: an admin reads the Interfaces card on System > Network, stages a
 * VLAN from it, and throws a staged change away with Revert Changes.
 *
 * Interface edits are staged until Test Changes and Save Changes apply them
 * (see `fixtures/interfaces.ts`). Neither is pressed here, and nothing here
 * calls `interface.commit`: the CI appliance has one NIC, the one the suite
 * talks to, and applying anything to it can cut the run off. Committing is
 * #14537's, on an appliance with a spare NIC. Staging and reverting never
 * touch the NIC, which is what the last assertion of the add test checks.
 *
 * The NIC's name differs per machine, so it is read from `interface.query`
 * rather than written down.
 */
import {
  ensureNoPendingInterfaceChanges, findInterface, findManagementInterface, hasNetworkConfigToBeRemoved,
  hasPendingInterfaceChanges, listInterfaces, readIpv4Addresses, stageVlan,
} from '../fixtures/interfaces';
import { goToNetwork } from '../flows/navigation';
import {
  addVlan, answerGatewayDialog, openAddInterfaceForm, openInterfaceActions, revertNetworkChanges,
} from '../flows/network-interfaces';
import { interfacesCardLocators, pendingChangesLocators } from '../locators/network-interfaces';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const vlanName = 'vlan100';
const vlanTag = 100;
const vlanDescription = 'e2e staged vlan';

const card = interfacesCardLocators;
const pending = pendingChangesLocators;

/**
 * Rolled back before each test as well as after, so an interrupted run leaves
 * the next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await ensureNoPendingInterfaceChanges(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the staged interface changes, ${vlanName} among them`)) {
    return;
  }

  await runCleanupSteps([
    ['roll back the staged interface changes', () => ensureNoPendingInterfaceChanges(api)],
  ]);
});

test('the Interfaces card lists every interface, and the NIC with its address and MAC', async ({ page, api }) => {
  const interfaces = await listInterfaces(api);
  const nic = await findManagementInterface(api);

  await goToNetwork(page);

  for (const entry of interfaces) {
    await expect(page.locator(card.row(entry.name))).toBeVisible();
  }

  // The NIC's address is DHCP's lease, which the card reads from `state.aliases`
  // because none is configured.
  for (const address of nic.ipv4Addresses) {
    await expect(page.locator(card.ipAddresses(nic.name))).toContainText(address);
  }
  await expect(page.locator(card.macAddress(nic.name))).toHaveText(nic.macAddress);

  // A physical NIC can be reset but not deleted. The add test below opens a
  // VLAN's menu and finds Delete there, so the id this looks for is a real one.
  await openInterfaceActions(page, nic.name);
  await expect(page.locator(card.reset(nic.name))).toBeVisible();
  await expect(page.locator(card.delete(nic.name))).toHaveCount(0);
});

test('adding a VLAN stages it, and the NIC keeps its address', async ({ page, api }) => {
  const nic = await findManagementInterface(api);
  expect(await hasPendingInterfaceChanges(api)).toBe(false);

  await openAddInterfaceForm(page);
  await addVlan(page, {
    name: vlanName,
    description: vlanDescription,
    parent: nic.name,
    tag: vlanTag,
  });
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));

  await expect(page.locator(pending.testChanges)).toBeVisible();
  await expect(page.locator(pending.revertChanges)).toBeVisible();
  await expect(page.locator(pending.checkinTimeout)).toBeVisible();
  await expect(page.locator(card.name(vlanName))).toHaveText(`${vlanName} (${vlanDescription})`);

  // Delete where the NIC has Reset.
  await openInterfaceActions(page, vlanName);
  await expect(page.locator(card.delete(vlanName))).toBeVisible();
  await expect(page.locator(card.reset(vlanName))).toHaveCount(0);

  expect(await hasPendingInterfaceChanges(api)).toBe(true);
  expect(await findInterface(api, vlanName)).toMatchObject({
    type: 'VLAN',
    description: vlanDescription,
    vlan_parent_interface: nic.name,
    vlan_tag: vlanTag,
  });

  // Staged, not applied: the NIC still holds exactly the addresses it had.
  expect(await readIpv4Addresses(api, nic.name)).toEqual(nic.ipv4Addresses);
});

test('Revert Changes throws a staged VLAN away', async ({ page, api }) => {
  const nic = await findManagementInterface(api);
  await stageVlan(api, { name: vlanName, parent: nic.name, tag: vlanTag });

  await goToNetwork(page);
  await expect(page.locator(card.row(vlanName))).toBeVisible();

  await revertNetworkChanges(page);
  await expect(page.locator(card.row(vlanName))).toBeHidden();

  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await findInterface(api, vlanName)).toBeUndefined();
});
