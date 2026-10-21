/**
 * Stories: an admin stages a bridge and a link aggregation from the Interfaces
 * card's Add form, deletes a staged VLAN from the card, and opens the NIC's own
 * edit form without saving it.
 *
 * Nothing here commits. Test Changes and Save Changes are never pressed and
 * `interface.commit` is never called: the CI appliance has one NIC, the one the
 * suite talks to, and applying anything to it can cut the run off. Committing is
 * #14537's, on an appliance with a spare NIC. Every test ends by checking that
 * the NIC still holds the addresses it started with.
 *
 * Bridge members and LAGG ports are what the appliance offers, read from
 * `interface.bridge_members_choices` and `interface.lag_ports_choices` rather
 * than written down, since both depend on how the NIC was set up.
 */
import { entitlementFeature, isNotDenied } from '../fixtures/entitlements';
import {
  ensureNoPendingInterfaceChanges, findInterface, findManagementInterface, hasNetworkConfigToBeRemoved,
  hasPendingInterfaceChanges, listInterfaces, readAvailableFecModes, readBridgeMembersChoices,
  readIpv4Addresses, readLacpduRateChoices, readLagPortsChoices, stageVlan,
} from '../fixtures/interfaces';
import { saveInterface } from '../flows/ha';
import { goToNetwork } from '../flows/navigation';
import {
  addBridge, answerGatewayDialog, chooseInterfaceType, closeFormSelect, closeInterfaceForm,
  deleteInterfaceFromCard, openAddInterfaceForm, openEditInterfaceForm, openFormSelect, openInterfaceActions,
  revertNetworkChanges,
} from '../flows/network-interfaces';
import { selectOption } from '../flows/storage';
import { haInterfaceLocators } from '../locators/ha';
import {
  interfaceFormLocators, interfacesCardLocators, pendingChangesLocators,
} from '../locators/network-interfaces';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const bridgeDescription = 'e2e staged bridge';
const vlanName = 'vlan101';
const vlanTag = 101;

/** `interface.available_fec_modes` reads the NIC through netlink before it answers. */
const fecModesTimeoutMs = 15_000;

const card = interfacesCardLocators;
const form = interfaceFormLocators;
const pending = pendingChangesLocators;

/**
 * Rolled back before each test as well as after, so an interrupted run leaves
 * the next one able to start, and unconditionally so a failure still cleans up.
 * Rollback is all there is to undo: the NIC itself is never updated here.
 */
test.beforeEach(async ({ api }) => {
  await ensureNoPendingInterfaceChanges(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the staged interface changes: a bridge, a LAGG or a VLAN')) {
    return;
  }

  await runCleanupSteps([
    ['roll back the staged interface changes', () => ensureNoPendingInterfaceChanges(api)],
  ]);
});

test('an admin stages a bridge from Add, and Revert Changes throws it away', async ({ page, api }) => {
  const nic = await findManagementInterface(api);
  const memberChoices = await readBridgeMembersChoices(api);
  expect(await hasPendingInterfaceChanges(api)).toBe(false);

  await openAddInterfaceForm(page);
  const bridgeName = await chooseInterfaceType(page, 'Bridge');
  expect(bridgeName).toMatch(/^br\d+$/);

  // Offered exactly what middleware names, and nothing else.
  await openFormSelect(page, form.bridgeMembers);
  await expect(page.locator(form.bridgeMembersOptions)).toHaveCount(Object.keys(memberChoices).length);
  for (const label of Object.values(memberChoices)) {
    await expect(page.locator(form.bridgeMemberOption(label))).toBeVisible();
  }
  await closeFormSelect(page, form.bridgeMembersOptions);
  await expect(page.locator(form.enableLearning)).toBeChecked();

  // No members: middleware requires the key, not an entry in it, so an empty
  // bridge stages, and leaving the NIC out keeps the one interface the suite
  // depends on out of the staged configuration.
  await addBridge(page, { description: bridgeDescription, members: [] });
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));

  await expect(page.locator(pending.testChanges)).toBeVisible();
  await expect(page.locator(pending.revertChanges)).toBeVisible();
  await expect(page.locator(card.name(bridgeName))).toHaveText(`${bridgeName} (${bridgeDescription})`);
  await openInterfaceActions(page, bridgeName);
  await expect(page.locator(card.delete(bridgeName))).toBeVisible();
  await expect(page.locator(card.reset(bridgeName))).toHaveCount(0);
  // The menu is an overlay over the pending-changes card, so it goes before Revert.
  await page.keyboard.press('Escape');
  await expect(page.locator(card.delete(bridgeName))).toBeHidden();

  expect(await hasPendingInterfaceChanges(api)).toBe(true);
  expect(await findInterface(api, bridgeName)).toMatchObject({
    type: 'BRIDGE',
    description: bridgeDescription,
    enable_learning: true,
    bridge_members: [],
  });

  await revertNetworkChanges(page);
  await expect(page.locator(card.row(bridgeName))).toBeHidden();

  expect(await findInterface(api, bridgeName)).toBeUndefined();
  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await readIpv4Addresses(api, nic.name)).toEqual(nic.ipv4Addresses);
});

test('an admin deletes a staged VLAN from the card, and nothing else changes', async ({ page, api }) => {
  const nic = await findManagementInterface(api);
  const namesBefore = (await listInterfaces(api)).map((entry) => entry.name);
  await stageVlan(api, { name: vlanName, parent: nic.name, tag: vlanTag });

  await goToNetwork(page);
  await expect(page.locator(card.row(vlanName))).toBeVisible();

  await deleteInterfaceFromCard(page, vlanName);

  await expect(page.locator(card.row(vlanName))).toBeHidden();
  for (const name of namesBefore) {
    await expect(page.locator(card.row(name))).toBeVisible();
  }

  expect(await findInterface(api, vlanName)).toBeUndefined();
  expect((await listInterfaces(api)).map((entry) => entry.name)).toEqual(namesBefore);

  // Still pending, though the database is back where it started: middleware
  // snapshots the configuration on the first staged change and answers
  // `has_pending_changes` from that snapshot existing, not from a diff. Only a
  // rollback or a check-in clears it, so the card stays, offering both.
  expect(await hasPendingInterfaceChanges(api)).toBe(true);
  await expect(page.locator(pending.revertChanges)).toBeVisible();

  expect(await readIpv4Addresses(api, nic.name)).toEqual(nic.ipv4Addresses);
});

test.describe('the NIC\'s edit form', () => {
  test.use({ recordApiCalls: true });

  test('loads its settings and FEC modes, and closing it changes nothing', async ({ page, api, entitlements }) => {
    const { name, ipv4Addresses } = await findManagementInterface(api);
    const before = await findInterface(api, name);
    if (!before) {
      throw new Error(`interface.query reports no interface named ${name}`);
    }
    const fecModes = await readAvailableFecModes(api, before.id);
    test.info().annotations.push({ type: 'interface.available_fec_modes', description: JSON.stringify(fecModes) });

    await openEditInterfaceForm(page, name);

    await expect(page.locator(form.type)).toHaveCount(0);
    await expect(page.locator(form.name)).not.toBeEditable();
    await expect(page.locator(form.description)).toHaveValue(before.description);
    await expect(page.locator(form.mtu)).toHaveValue(String(before.mtu ?? 1500));
    await expect(page.locator(before.ipv4_dhcp ? form.dhcp : haInterfaceLocators.form.staticAddresses)).toBeChecked();

    if (isNotDenied(entitlements, entitlementFeature.networkFec)) {
      // The form asks whatever the answer, so the request is the evidence: on a
      // NIC without FEC, as a virtio one is, it answers `[]` and nothing shows.
      await expect.poll(
        () => apiCallsTo(page, 'interface.available_fec_modes').map((call) => call.answer),
        { timeout: fecModesTimeoutMs },
      ).toEqual(['result']);

      if (fecModes.length > 0) {
        await openFormSelect(page, form.fecMode);
        await expect(page.locator(form.fecModeOptions)).toHaveCount(fecModes.length);
        await closeFormSelect(page, form.fecModeOptions);
      } else {
        await expect(page.locator(form.fecMode)).toHaveCount(0);
      }
    } else {
      // Denied, the form never asks. The form has loaded the record by now, so
      // this is a backstop rather than a wait: a late request would still pass.
      expect(apiCallsTo(page, 'interface.available_fec_modes')).toEqual([]);
      await expect(page.locator(form.fecMode)).toHaveCount(0);
    }

    // Never Save: that would update the NIC the suite talks to.
    await closeInterfaceForm(page);

    expect(await hasPendingInterfaceChanges(api)).toBe(false);
    expect(await findInterface(api, name)).toMatchObject({
      description: before.description,
      ipv4_dhcp: before.ipv4_dhcp,
      aliases: before.aliases,
      mtu: before.mtu,
    });
    expect(await readIpv4Addresses(api, name)).toEqual(ipv4Addresses);
  });
});

test('the Link Aggregation form refuses a LAGG with no ports, and stages one with a port on offer', async ({
  page,
  api,
}) => {
  const nic = await findManagementInterface(api);
  const portChoices = await readLagPortsChoices(api);
  const lacpduRates = await readLacpduRateChoices(api);
  test.info().annotations.push({ type: 'interface.lag_ports_choices', description: JSON.stringify(portChoices) });

  await openAddInterfaceForm(page);
  const lagName = await chooseInterfaceType(page, 'Link Aggregation');
  expect(lagName).toMatch(/^bond\d+$/);

  // Hidden until LACP is picked, so seeing them is the pick's doing.
  await expect(page.locator(form.lacpduRate)).toHaveCount(0);
  await selectOption(page, form.lagProtocol, form.lagProtocolOption('LACP'));
  await expect(page.locator(form.xmitHashPolicy)).toBeVisible();
  await expect(page.locator(form.lacpduRate)).toBeVisible();

  await openFormSelect(page, form.lacpduRate);
  await expect(page.locator(form.lacpduRateOptions)).toHaveCount(Object.keys(lacpduRates).length);
  for (const label of Object.values(lacpduRates)) {
    await expect(page.locator(form.lacpduRateOption(label))).toBeVisible();
  }
  // The default rate is kept.
  await closeFormSelect(page, form.lacpduRateOptions);

  // Link Aggregation Interfaces is required once the type is Link Aggregation.
  await expect(page.locator(haInterfaceLocators.form.save)).toBeDisabled();
  expect(await findInterface(api, lagName)).toBeUndefined();
  expect(await hasPendingInterfaceChanges(api)).toBe(false);

  const [offered] = Object.entries(portChoices);
  if (!offered) {
    // Middleware offers no interface with a row in its database, which a NIC
    // that was ever saved has. The refusal above is then all there is to test.
    expect(await readIpv4Addresses(api, nic.name)).toEqual(nic.ipv4Addresses);
    return;
  }

  await openFormSelect(page, form.lagPorts);
  await expect(page.locator(form.lagPortsOptions)).toHaveCount(Object.keys(portChoices).length);
  for (const label of Object.values(portChoices)) {
    await expect(page.locator(form.lagPortOption(label))).toBeVisible();
  }
  // Staging only: the port is never committed into the LAGG, and Revert takes it out again.
  const [port, portLabel] = offered;
  await page.locator(form.lagPortOption(portLabel)).click();
  await closeFormSelect(page, form.lagPortsOptions);

  await saveInterface(page, false);
  await answerGatewayDialog(page, await hasNetworkConfigToBeRemoved(api));

  await expect(page.locator(card.row(lagName))).toBeVisible();
  await expect(page.locator(pending.revertChanges)).toBeVisible();
  expect(await findInterface(api, lagName)).toMatchObject({
    type: 'LINK_AGGREGATION',
    lag_protocol: 'LACP',
    lag_ports: [port],
  });

  await revertNetworkChanges(page);
  await expect(page.locator(card.row(lagName))).toBeHidden();

  expect(await findInterface(api, lagName)).toBeUndefined();
  expect(await hasPendingInterfaceChanges(api)).toBe(false);
  expect(await readIpv4Addresses(api, nic.name)).toEqual(nic.ipv4Addresses);
});
