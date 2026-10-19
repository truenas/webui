/**
 * Stories: from a subsystem's details page, an admin opens Manage Ports or Manage
 * Hosts from the card's Add menu and edits or deletes a port or a host outright —
 * not its link to the subsystem, which `nvme-of.e2e.ts` covers. That dialog is the
 * only place in the UI a port or a host is changed or removed.
 *
 * Ports and hosts are shared between subsystems, so every test runs beside a second
 * subsystem holding its own port, host and namespace, which must come through
 * untouched. Deleting one that a subsystem uses is allowed: the dialog warns, names
 * the subsystem, and then deletes with `force`, which drops the link too.
 *
 * The service is never started. Editing a port that a subsystem uses is refused only
 * while the service runs, and nothing here needs a target that serves.
 */
import {
  associateNvmeOfHost, associateNvmeOfPort, ensureNvmeOfHostAbsent, ensureNvmeOfHostPresent, ensureNvmeOfPortAbsent,
  ensureNvmeOfPortPresent, ensureNvmeOfServiceStopped, ensureNvmeOfSubsystemAbsent, ensureNvmeOfSubsystemPresent,
  findNvmeOfHost, findNvmeOfPort, provisionLinkedNvmeOfSubsystem, requireNvmeOfSubsystem, requireRoomOnNvmeOfCard,
  setNvmeOfAllowAnyHost, type NvmeOfSubsystemRecord, type TcpPort,
} from '../fixtures/nvme-of';
import { ensureDatasetAbsent } from '../fixtures/storage';
import {
  cancelPortOrHostDelete, changeManagedPortServiceId, closeManageDialog, confirmPortOrHostDelete, discardHostForm,
  openManagedHostEdit, openManageHosts, openManagePorts, openNvmeOfSubsystemDetails, openPortOrHostDelete,
  saveHostWithGeneratedKeys, tryHostNqn,
} from '../flows/nvme-of';
import { nvmeOfLocators } from '../locators/nvme-of';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API; its details page is where every test starts. */
const targetName = 'e2e-nvme-manage-target';

/** Holds links of its own, which must survive whatever is done to the other. */
const bystanderName = 'e2e-nvme-manage-bystander';

const subsystemNames = [targetName, bystanderName];

/** Backs the bystander's namespace, so it has one to keep. */
const bystanderZvolName = 'e2e-nvme-manage-ns-bystander';

/**
 * Service ids nothing else uses — `nvme-of.e2e.ts` takes 4491 and 4492 — so a port
 * another feature or a person made is never touched.
 */
const targetPort: TcpPort = { address: '0.0.0.0', port: 4493 };
const bystanderPort: TcpPort = { address: '0.0.0.0', port: 4494 };
/** What the edit moves {@link targetPort} to. */
const editedPort: TcpPort = { address: '0.0.0.0', port: 4495 };
/** Linked to nothing, so its delete asks nothing. */
const unlinkedPort: TcpPort = { address: '0.0.0.0', port: 4496 };
/** Every port a test may leave behind, including the one an edit renames. */
const ports = [targetPort, bystanderPort, editedPort, unlinkedPort];

const targetHost = 'nqn.2014-08.org.nvmexpress:e2e-nvme-manage-target-host';
const bystanderHost = 'nqn.2014-08.org.nvmexpress:e2e-nvme-manage-bystander-host';
const hosts = [targetHost, bystanderHost];

/** Differs from the empty description a host is created with over the API. */
const editedDescription = 'e2e edited host';

async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    // Subsystems first: deleting one takes its namespaces and links with it, and a
    // zvol still behind a namespace cannot be removed.
    ...subsystemNames.map((name): [string, () => Promise<void>] => [
      `remove the NVMe-oF subsystem ${name}`, () => ensureNvmeOfSubsystemAbsent(api, name),
    ]),
    ...hosts.map((hostnqn): [string, () => Promise<void>] => [
      `remove the NVMe-oF host ${hostnqn}`, () => ensureNvmeOfHostAbsent(api, hostnqn),
    ]),
    ...ports.map((port): [string, () => Promise<void>] => [
      `remove the NVMe-oF port ${port.address}:${port.port}`, () => ensureNvmeOfPortAbsent(api, port),
    ]),
    [`remove the zvol ${pool}/${bystanderZvolName}`, () => ensureDatasetAbsent(api, `${pool}/${bystanderZvolName}`)],
    ['stop the NVMe-oF service', () => ensureNvmeOfServiceStopped(api)],
  ]);
}

/** The bystander, linked to its own port, host and namespace. */
async function provisionBystander(api: E2eApiClient, pool: string): Promise<NvmeOfSubsystemRecord> {
  return provisionLinkedNvmeOfSubsystem(api, {
    name: bystanderName,
    zvol: `${pool}/${bystanderZvolName}`,
    port: bystanderPort,
    hostnqn: bystanderHost,
  });
}

/** Fails unless the bystander still holds exactly what it was provisioned with. */
async function expectBystanderUntouched(api: E2eApiClient, before: NvmeOfSubsystemRecord): Promise<void> {
  expect(await requireNvmeOfSubsystem(api, bystanderName)).toMatchObject({
    ports: before.ports,
    hosts: before.hosts,
    namespaces: before.namespaces,
  });
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the next
 * one able to start.
 */
test.beforeEach(async ({ api, pool }) => {
  await removeEverything(api, pool);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(
    `the NVMe-oF subsystems ${subsystemNames.join(', ')}, their hosts, ports and the zvol on ${pool}`,
  )) {
    return;
  }

  await removeEverything(api, pool);
});

test('an admin changes the service id of a linked port from Manage Ports', async ({ page, api, pool }) => {
  const { managePortsDialog, details } = nvmeOfLocators;
  await requireRoomOnNvmeOfCard(api, 2);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  const port = await ensureNvmeOfPortPresent(api, targetPort);
  await associateNvmeOfPort(api, { subsystemId: target.id, portId: port.id });
  const bystanderBefore = await provisionBystander(api, pool);
  const bystanderPortBefore = await findNvmeOfPort(api, bystanderPort);

  await openNvmeOfSubsystemDetails(page, targetName);
  await openManagePorts(page);

  await expect(page.locator(managePortsDialog.usedInSubsystems(targetPort))).toHaveText('1', {
    timeout: 10_000,
  });

  await changeManagedPortServiceId(page, targetPort, editedPort.port);

  // The dialog reloads ports alone, so this is the reload landing, not the page.
  await expect(page.locator(managePortsDialog.row(editedPort))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(managePortsDialog.row(targetPort))).toBeHidden();

  await closeManageDialog(page);
  await expect(page.locator(details.removePort(editedPort))).toBeVisible();

  // An edit, not a replacement: the same port, still linked, on the address it had.
  expect(await findNvmeOfPort(api, editedPort)).toMatchObject({ id: port.id, addr_traddr: '0.0.0.0' });
  expect(await findNvmeOfPort(api, targetPort)).toBeUndefined();
  expect((await requireNvmeOfSubsystem(api, targetName)).ports).toEqual([port.id]);

  expect(await findNvmeOfPort(api, bystanderPort)).toEqual(bystanderPortBefore);
  await expectBystanderUntouched(api, bystanderBefore);
});

test('an admin adds host authentication to an existing host from Manage Hosts', async ({ page, api, pool }) => {
  const { manageHostsDialog, details } = nvmeOfLocators;
  await requireRoomOnNvmeOfCard(api, 2);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  const host = await ensureNvmeOfHostPresent(api, targetHost);
  await setNvmeOfAllowAnyHost(api, { subsystemId: target.id, allowAnyHost: false });
  await associateNvmeOfHost(api, { subsystemId: target.id, hostId: host.id });
  const bystanderBefore = await provisionBystander(api, pool);

  await openNvmeOfSubsystemDetails(page, targetName);
  await openManageHosts(page);

  // Read before the edit, so the Yes after it is the edit's doing.
  await expect(page.locator(manageHostsDialog.hasAuthentication(targetHost))).toHaveText('No', {
    timeout: 10_000,
  });

  await openManagedHostEdit(page, targetHost);
  await saveHostWithGeneratedKeys(page, editedDescription);

  await expect(page.locator(manageHostsDialog.description(targetHost))).toHaveText(editedDescription, {
    timeout: 10_000,
  });
  await expect(page.locator(manageHostsDialog.hasAuthentication(targetHost))).toHaveText('Yes');

  await closeManageDialog(page);
  await expect(page.locator(details.host(targetHost))).toContainText(editedDescription);

  expect(await findNvmeOfHost(api, targetHost)).toMatchObject({
    id: host.id,
    description: editedDescription,
    dhchap_key: expect.stringMatching(/^DHHC-1:/),
    dhchap_ctrl_key: expect.stringMatching(/^DHHC-1:/),
    dhchap_hash: 'SHA-256',
    // Diffie–Hellman was not asked for, so none is stored.
    dhchap_dhgroup: null,
  });
  expect((await requireNvmeOfSubsystem(api, targetName)).hosts).toEqual([host.id]);
  await expectBystanderUntouched(api, bystanderBefore);
});

test('deleting a port or host a subsystem uses warns and forces; an unused one does not', async ({
  page, api, pool,
}) => {
  const {
    manageHostsDialog,
    managePortsDialog,
    portOrHostDeleteDialog,
    details,
  } = nvmeOfLocators;
  await requireRoomOnNvmeOfCard(api, 2);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  const port = await ensureNvmeOfPortPresent(api, targetPort);
  const host = await ensureNvmeOfHostPresent(api, targetHost);
  await associateNvmeOfPort(api, { subsystemId: target.id, portId: port.id });
  await setNvmeOfAllowAnyHost(api, { subsystemId: target.id, allowAnyHost: false });
  await associateNvmeOfHost(api, { subsystemId: target.id, hostId: host.id });
  await ensureNvmeOfPortPresent(api, unlinkedPort);
  const bystanderBefore = await provisionBystander(api, pool);

  await openNvmeOfSubsystemDetails(page, targetName);
  await expect(page.locator(details.host(targetHost))).toBeVisible();

  // A linked host: the dialog names the subsystem and deletes anyway.
  await openManageHosts(page);
  await openPortOrHostDelete(page, manageHostsDialog.delete(targetHost));
  await expect(page.locator(portOrHostDeleteDialog.subsystemInUse(targetName))).toBeVisible();
  await expect(page.locator(portOrHostDeleteDialog.subsystemInUse(bystanderName))).toBeHidden();
  await expect(page.locator(portOrHostDeleteDialog.delete)).toHaveText('Delete Anyway');
  await confirmPortOrHostDelete(page, manageHostsDialog.row(targetHost));
  await closeManageDialog(page);
  await expect(page.locator(details.host(targetHost))).toBeHidden({ timeout: 10_000 });

  await expect.poll(() => findNvmeOfHost(api, targetHost)).toBeUndefined();
  expect((await requireNvmeOfSubsystem(api, targetName)).hosts).toEqual([]);

  // An unlinked port: nothing to warn about, and a plain Delete.
  await openManagePorts(page);
  await openPortOrHostDelete(page, managePortsDialog.delete(unlinkedPort));
  await expect(page.locator(portOrHostDeleteDialog.delete)).toHaveText('Delete');
  await expect(page.locator(portOrHostDeleteDialog.inUseMessage)).toBeHidden();
  await confirmPortOrHostDelete(page, managePortsDialog.row(unlinkedPort));

  await expect.poll(() => findNvmeOfPort(api, unlinkedPort)).toBeUndefined();

  // A linked port: Cancel keeps it, Delete Anyway removes it and its link.
  await openPortOrHostDelete(page, managePortsDialog.delete(targetPort));
  await expect(page.locator(portOrHostDeleteDialog.inUseMessage)).toBeVisible();
  await expect(page.locator(portOrHostDeleteDialog.subsystemInUse(targetName))).toBeVisible();
  await cancelPortOrHostDelete(page);
  expect(await findNvmeOfPort(api, targetPort)).toMatchObject({ id: port.id });

  await openPortOrHostDelete(page, managePortsDialog.delete(targetPort));
  await expect(page.locator(portOrHostDeleteDialog.delete)).toHaveText('Delete Anyway');
  await confirmPortOrHostDelete(page, managePortsDialog.row(targetPort));

  await expect.poll(() => findNvmeOfPort(api, targetPort)).toBeUndefined();
  expect((await requireNvmeOfSubsystem(api, targetName)).ports).toEqual([]);
  await expectBystanderUntouched(api, bystanderBefore);
});

test('the host form refuses a Host NQN that is not an NQN', async ({ page, api }) => {
  const { hostForm } = nvmeOfLocators;
  await requireRoomOnNvmeOfCard(api, 1);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  const host = await ensureNvmeOfHostPresent(api, targetHost);
  await setNvmeOfAllowAnyHost(api, { subsystemId: target.id, allowAnyHost: false });
  await associateNvmeOfHost(api, { subsystemId: target.id, hostId: host.id });

  await openNvmeOfSubsystemDetails(page, targetName);
  await openManageHosts(page);
  await openManagedHostEdit(page, targetHost);

  // Enabled on the host as loaded, so the disabled Save below is the NQN's doing.
  await expect(page.locator(hostForm.save)).toBeEnabled();

  await tryHostNqn(page, 'iqn.2005-10.org.example:e2e');

  await expect(page.locator(hostForm.hostnqnField)).toContainText('Host NQN must start with "nqn."');
  await expect(page.locator(hostForm.save)).toBeDisabled();

  expect(await findNvmeOfHost(api, targetHost)).toMatchObject({ id: host.id, hostnqn: targetHost });

  await discardHostForm(page);
});
