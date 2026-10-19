/**
 * Stories: an admin creates an NVMe-oF subsystem with the Add Subsystem form on the
 * Shares dashboard, changes what is attached to one from its details page, adds a
 * host that has to authenticate, deletes one from its row on the dashboard card, and
 * sets the global base NQN — and the appliance holds what they did.
 *
 * A subsystem is only useful with what hangs off it, so every check reads the
 * associations back through the API: which namespaces, ports and hosts the subsystem
 * lists. Ports and hosts are shared, so the details-page tests run beside a second
 * subsystem holding links of its own, which must come through untouched.
 *
 * The service is never started. Nothing here needs a target that serves, and the add
 * form's start prompt is only raised while the service is stopped. RDMA and ANA need
 * RDMA hardware and HA, which the CI appliance does not have, so the global
 * configuration is checked to keep them out of reach rather than driven. The SPDK
 * implementation needs the `NVMEOF_SPDK` entitlement, which CI's license grants and a
 * community appliance lacks, so whether it is offered follows that.
 */
import { entitlementFeature, isNotDenied } from '../fixtures/entitlements';
import {
  ensureNvmeOfHostAbsent, ensureNvmeOfHostPresent, ensureNvmeOfPortAbsent, ensureNvmeOfPortPresent,
  ensureNvmeOfServiceStopped, ensureNvmeOfSubsystemAbsent, ensureNvmeOfSubsystemPresent, findNvmeOfHost,
  findNvmeOfNamespaces, findNvmeOfPort, findNvmeOfSubsystem, provisionLinkedNvmeOfSubsystem, readNvmeOfBaseNqn,
  requireNvmeOfSubsystem, requireRoomOnNvmeOfCard, restoreNvmeOfBaseNqn, setNvmeOfAllowAnyHost, type TcpPort,
  zvolDevicePath,
} from '../fixtures/nvme-of';
import { ensureDatasetAbsent, ensureZvolPresent, findDataset } from '../fixtures/storage';
import {
  addHostOnDetails, addNamespaceOnDetails, addPortOnDetails, createAuthenticatedHostOnDetails,
  createNvmeOfSubsystem, deleteNamespaceOnDetails, deleteNvmeOfSubsystemFromCard, openNvmeOfGlobalConfiguration,
  openNvmeOfSubsystemDetails, removeHostOnDetails, removePortOnDetails, saveNvmeOfBaseNqn,
} from '../flows/nvme-of';
import { nvmeOfLocators } from '../locators/nvme-of';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the add form, never over the API — that is the thing under test. */
const createdName = 'e2e-nvme-created';

/** Provisioned over the API, for the details page and the delete to act on. */
const targetName = 'e2e-nvme-target';

/** Holds links of its own, which must survive whatever is done to the other. */
const bystanderName = 'e2e-nvme-bystander';

const subsystemNames = [createdName, targetName, bystanderName];

/** One zvol per namespace, since a zvol backs at most one. Named after what uses it. */
const zvolNames = ['e2e-nvme-ns-created', 'e2e-nvme-ns-target', 'e2e-nvme-ns-added', 'e2e-nvme-ns-bystander'];

/**
 * Ports on a service id nothing else uses, so a port another feature or a person
 * made is never touched, and the Add menu's ids are known.
 */
const targetPort: TcpPort = { address: '0.0.0.0', port: 4491 };
const bystanderPort: TcpPort = { address: '0.0.0.0', port: 4492 };
const ports = [targetPort, bystanderPort];

const targetHost = 'nqn.2014-08.org.nvmexpress:e2e-nvme-target-host';
const bystanderHost = 'nqn.2014-08.org.nvmexpress:e2e-nvme-bystander-host';
/** Created through the host form, with authentication. */
const authenticatedHost = 'nqn.2014-08.org.nvmexpress:e2e-nvme-auth-host';
const hosts = [targetHost, bystanderHost, authenticatedHost];

/**
 * What the global configuration test sets: whichever of the two differs from the
 * base NQN it finds. Two, because a run that kept its test data leaves the one it
 * set behind, and the next run reads that as the original.
 */
const firstBaseNqn = 'nqn.2011-06.com.truenas:e2e-nvme-basenqn-a';
const secondBaseNqn = 'nqn.2011-06.com.truenas:e2e-nvme-basenqn-b';

/** Read once, before any test can change it, and written back after each. */
let originalBaseNqn: string;

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
    ...zvolNames.map((name): [string, () => Promise<void>] => [
      `remove the zvol ${pool}/${name}`, () => ensureDatasetAbsent(api, `${pool}/${name}`),
    ]),
    ['restore the NVMe-oF base NQN', () => restoreNvmeOfBaseNqn(api, originalBaseNqn)],
    ['stop the NVMe-oF service', () => ensureNvmeOfServiceStopped(api)],
  ]);
}

test.beforeAll(async ({ api }) => {
  originalBaseNqn = await readNvmeOfBaseNqn(api);
});

/**
 * Removed before each test as well as after, so an interrupted run leaves the next
 * one able to start. The service is stopped because what the add form asks after
 * Save depends on it.
 */
test.beforeEach(async ({ api, pool }) => {
  await removeEverything(api, pool);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(
    `the NVMe-oF subsystems ${subsystemNames.join(', ')}, their hosts, ports and zvols on ${pool}, and the base NQN`,
  )) {
    return;
  }

  await removeEverything(api, pool);
});

test('an admin adds a subsystem with a zvol namespace, a TCP port and one host', async ({ page, api, pool }) => {
  const zvol = `${pool}/e2e-nvme-ns-created`;
  await requireRoomOnNvmeOfCard(api, 1);
  await ensureZvolPresent(api, zvol);
  // Ports and hosts are picked from what exists; the form under test is the subsystem's.
  const port = await ensureNvmeOfPortPresent(api, targetPort);
  const host = await ensureNvmeOfHostPresent(api, targetHost);

  await createNvmeOfSubsystem(page, {
    name: createdName,
    zvol,
    port: targetPort,
    hostnqn: targetHost,
  });

  await expect(page.locator(nvmeOfLocators.card.name(createdName))).toHaveText(createdName);

  // The links are made one call each after the subsystem, so poll until the last lands.
  await expect.poll(async () => {
    const subsystem = await findNvmeOfSubsystem(api, createdName);
    return { ports: subsystem?.ports, hosts: subsystem?.hosts, namespaces: subsystem?.namespaces?.length };
  }).toEqual({ ports: [port.id], hosts: [host.id], namespaces: 1 });

  const subsystem = await requireNvmeOfSubsystem(api, createdName);
  // Unticking "Allow any host" is what makes the host link mean anything.
  expect(subsystem.allow_any_host).toBe(false);

  expect(await findNvmeOfNamespaces(api, zvolDevicePath(zvol))).toEqual([
    expect.objectContaining({ device_type: 'ZVOL', subsys: expect.objectContaining({ id: subsystem.id }) }),
  ]);
});

test('adding a namespace, port and host on the details page changes that one only', async ({ page, api, pool }) => {
  const addedZvol = `${pool}/e2e-nvme-ns-added`;
  await requireRoomOnNvmeOfCard(api, 2);
  await ensureZvolPresent(api, addedZvol);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  const port = await ensureNvmeOfPortPresent(api, targetPort);
  const host = await ensureNvmeOfHostPresent(api, targetHost);
  const bystanderBefore = await provisionLinkedNvmeOfSubsystem(api, {
    name: bystanderName,
    zvol: `${pool}/e2e-nvme-ns-bystander`,
    port: bystanderPort,
    hostnqn: bystanderHost,
  });

  await openNvmeOfSubsystemDetails(page, targetName);
  await addNamespaceOnDetails(page, addedZvol);
  await addPortOnDetails(page, targetPort);
  await addHostOnDetails(page, targetHost);

  await expect.poll(async () => {
    const subsystem = await findNvmeOfSubsystem(api, targetName);
    return { ports: subsystem?.ports, hosts: subsystem?.hosts };
  }).toEqual({ ports: [port.id], hosts: [host.id] });

  expect(await findNvmeOfNamespaces(api, zvolDevicePath(addedZvol))).toEqual([
    expect.objectContaining({ device_type: 'ZVOL', subsys: expect.objectContaining({ id: target.id }) }),
  ]);
  // Adding a host to a subsystem that allowed any host also restricts it to its hosts.
  expect((await requireNvmeOfSubsystem(api, targetName)).allow_any_host).toBe(false);

  expect(await requireNvmeOfSubsystem(api, bystanderName)).toMatchObject({
    ports: bystanderBefore.ports,
    hosts: bystanderBefore.hosts,
    namespaces: bystanderBefore.namespaces,
  });
});

test('removing a namespace, port and host on the details page changes that one only', async ({ page, api, pool }) => {
  const zvol = `${pool}/e2e-nvme-ns-target`;
  await requireRoomOnNvmeOfCard(api, 2);
  await provisionLinkedNvmeOfSubsystem(api, {
    name: targetName,
    zvol,
    port: targetPort,
    hostnqn: targetHost,
  });
  const bystanderBefore = await provisionLinkedNvmeOfSubsystem(api, {
    name: bystanderName,
    zvol: `${pool}/e2e-nvme-ns-bystander`,
    port: bystanderPort,
    hostnqn: bystanderHost,
  });

  await openNvmeOfSubsystemDetails(page, targetName);
  await deleteNamespaceOnDetails(page, zvolDevicePath(zvol));
  await removePortOnDetails(page, targetPort);
  await removeHostOnDetails(page, targetHost);

  await expect.poll(async () => {
    const subsystem = await findNvmeOfSubsystem(api, targetName);
    return { ports: subsystem?.ports, hosts: subsystem?.hosts, namespaces: subsystem?.namespaces };
  }).toEqual({ ports: [], hosts: [], namespaces: [] });

  // Unlinking is not deleting: the port, the host and the zvol are all still there.
  expect(await findNvmeOfPort(api, targetPort)).toBeDefined();
  expect(await findNvmeOfHost(api, targetHost)).toBeDefined();
  expect(await findDataset(api, zvol)).toBeDefined();

  expect(await requireNvmeOfSubsystem(api, bystanderName)).toMatchObject({
    ports: bystanderBefore.ports,
    hosts: bystanderBefore.hosts,
    namespaces: bystanderBefore.namespaces,
  });
});

test('a host created with Require Host Authentication is saved with its key', async ({ page, api }) => {
  await requireRoomOnNvmeOfCard(api, 1);
  const target = await ensureNvmeOfSubsystemPresent(api, targetName);
  // Restricted, so the Add menu also offers "Allow all hosts" and is a menu whatever
  // other hosts the appliance has.
  await setNvmeOfAllowAnyHost(api, { subsystemId: target.id, allowAnyHost: false });

  await openNvmeOfSubsystemDetails(page, targetName);
  await createAuthenticatedHostOnDetails(page, authenticatedHost);

  const host = await findNvmeOfHost(api, authenticatedHost);
  expect(host).toMatchObject({
    hostnqn: authenticatedHost,
    dhchap_hash: 'SHA-256',
    dhchap_key: expect.stringMatching(/^DHHC-1:/),
    // Diffie–Hellman was not asked for, so none is stored.
    dhchap_dhgroup: null,
  });

  // The form's save also links the new host to the subsystem it was opened from.
  await expect.poll(async () => (await findNvmeOfSubsystem(api, targetName))?.hosts).toEqual([host?.id]);
});

test('deleting a subsystem from the card removes it and its associations', async ({ page, api, pool }) => {
  const zvol = `${pool}/e2e-nvme-ns-target`;
  await requireRoomOnNvmeOfCard(api, 2);
  await provisionLinkedNvmeOfSubsystem(api, {
    name: targetName,
    zvol,
    port: targetPort,
    hostnqn: targetHost,
  });
  const bystanderBefore = await provisionLinkedNvmeOfSubsystem(api, {
    name: bystanderName,
    zvol: `${pool}/e2e-nvme-ns-bystander`,
    port: bystanderPort,
    hostnqn: bystanderHost,
  });

  await deleteNvmeOfSubsystemFromCard(page, targetName);

  // Polled rather than read once: the row can also be hidden while the card is
  // between loads, which proves nothing.
  await expect.poll(() => findNvmeOfSubsystem(api, targetName)).toBeUndefined();
  expect(await findNvmeOfNamespaces(api, zvolDevicePath(zvol))).toEqual([]);
  // The shared objects outlive the links; only the subsystem's own namespace goes.
  expect(await findNvmeOfPort(api, targetPort)).toBeDefined();
  expect(await findNvmeOfHost(api, targetHost)).toBeDefined();
  expect(await findDataset(api, zvol)).toBeDefined();

  // The whole point of the second subsystem: the card looks right either way.
  await expect(page.locator(nvmeOfLocators.card.row(bystanderName))).toBeVisible();
  expect(await requireNvmeOfSubsystem(api, bystanderName)).toMatchObject({
    id: bystanderBefore.id,
    ports: bystanderBefore.ports,
    hosts: bystanderBefore.hosts,
    namespaces: bystanderBefore.namespaces,
  });
});

test('the global configuration saves the base NQN and offers RDMA, ANA and SPDK only where usable', async ({
  page, api, entitlements,
}) => {
  const changedBaseNqn = originalBaseNqn === firstBaseNqn ? secondBaseNqn : firstBaseNqn;

  await openNvmeOfGlobalConfiguration(page);

  // No RDMA-capable NIC and no HA on the CI appliance.
  await expect(page.locator(nvmeOfLocators.globalConfig.rdma)).toBeDisabled();
  await expect(page.locator(nvmeOfLocators.globalConfig.ana)).toBeDisabled();
  const spdk = page.locator(nvmeOfLocators.globalConfig.spdk);
  if (isNotDenied(entitlements, entitlementFeature.nvmeOfSpdk)) {
    await expect(spdk).toBeVisible();
  } else {
    await expect(spdk).toBeHidden();
  }

  await saveNvmeOfBaseNqn(page, changedBaseNqn);

  expect(await readNvmeOfBaseNqn(api)).toBe(changedBaseNqn);
});
