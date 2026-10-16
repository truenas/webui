/**
 * Stories: an admin adds an SSH connection from the SSH Connections card on
 * Credentials > Backup Credentials, both Manual and Semi-automatic, edits one,
 * and deletes one with and without its keypair — and the appliance holds what
 * they did.
 *
 * Every connection points back at the appliance itself, `127.0.0.1`, so no
 * second system is needed: Discover Remote Host Key scans the appliance's own
 * SSH, and Semi-automatic signs in to its own middleware with the suite's admin
 * credentials. Each is asserted on the card and through
 * `keychaincredential.query`, which holds the host, key and keypair the card
 * does not show.
 *
 * Semi-automatic changes the appliance beyond the connection: middleware
 * enables and starts SSH and appends the new public key to root's `sshpubkey`.
 * So the file reads root's keys and the SSH service before anything runs and
 * writes both back. SSH has to be running for the host key scan, and is
 * stopped again only if this file found it stopped.
 *
 * Edit and delete each act on a connection made over the API with
 * `fixtures/ssh-connections.ts`. Edit runs beside a second connection that must
 * come through untouched, since a row-targeting bug edits the wrong one without
 * failing anything else.
 */
import { readRootAuthorizedKeys, setRootAuthorizedKeys } from '../fixtures/loopback-ssh';
import { readSshSettings } from '../fixtures/service-config';
import {
  ensureServiceRunning, queryService, restoreService, type ServiceState,
} from '../fixtures/services';
import {
  countSshConnections,
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
  findSshConnection,
  loopbackHost,
  loopbackKeypairName,
  sshConnectionAttributes,
} from '../fixtures/ssh-connections';
import {
  ensureSshKeypairAbsent, ensureSshKeypairPresent, findSshKeypair, keypairKeys,
} from '../fixtures/ssh-keypairs';
import {
  deleteSshConnection,
  discoverRemoteHostKey,
  fillManualSshConnection,
  fillSemiAutomaticSshConnection,
  openAddSshConnectionForm,
  openEditSshConnectionForm,
  saveSshConnectionForm,
  sshConnectionCardPageSize,
} from '../flows/ssh-connections';
import { sshConnectionLocators } from '../locators/ssh-connections';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const manualName = 'e2e-sshcon-manual';
const semiAutomaticName = 'e2e-sshcon-semi';

/** The keypair the Manual connection signs in with. Provisioned over the API: it is not under test. */
const manualKeypair = 'e2e-sshcon-manual-keypair';

/** What the form names the keypair Generate New makes — `prepareSetupRequest`. */
const semiAutomaticKeypair = `${semiAutomaticName} Key`;

/** Provisioned over the API so there is something to edit or delete. */
const editTarget = 'e2e-sshcon-edit-target';
const editBystander = 'e2e-sshcon-edit-bystander';
const deleteWithKeypair = 'e2e-sshcon-delete-with-key';
const deleteKeepKeypair = 'e2e-sshcon-delete-keep-key';

const apiConnections = [editTarget, editBystander, deleteWithKeypair, deleteKeepKeypair];

/** What the edit test changes. The form's default is 10. */
const editedConnectTimeout = 30;

/** Root's authorized keys and the SSH service, as this file found them. */
let rootKeysFound: string;
let sshFound: ServiceState;

/**
 * Connections first, since middleware will not delete a keypair one still
 * uses; then the keypairs, root's marked keys and root's keys as found.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...[manualName, semiAutomaticName].map((name): [string, () => Promise<void>] => [
      `remove the SSH connection "${name}"`, () => ensureSshConnectionAbsent(api, name),
    ]),
    ...apiConnections.flatMap((name): [string, () => Promise<void>][] => [
      [`remove the SSH connection "${name}"`, () => ensureSshConnectionAbsent(api, name)],
      [`remove root's key and the keypair for "${name}"`, () => ensureLoopbackSshAccessAbsent(api, name)],
    ]),
    ...[manualKeypair, semiAutomaticKeypair].map((name): [string, () => Promise<void>] => [
      `remove the SSH keypair "${name}"`, () => ensureSshKeypairAbsent(api, name),
    ]),
    ['write back root\'s authorized keys as found', async () => {
      if (await readRootAuthorizedKeys(api) !== rootKeysFound) {
        await setRootAuthorizedKeys(api, rootKeysFound);
      }
    }],
  ]);
}

/**
 * The card lists five connections, oldest first, before View All, and reloads
 * after a save with nothing to wait on — so, like the SSH keypairs spec, this
 * needs every row a test acts on to fit rather than expanding. A fresh
 * appliance holds none; failing here says why rather than timing out on a
 * hidden row.
 */
async function expectCardFits(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countSshConnections(api);
  expect(
    existing + adding <= sshConnectionCardPageSize,
    `the card lists ${sshConnectionCardPageSize} connections, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Read before anything runs, so teardown writes back what was really there.
 * Semi-automatic's key carries no marker, so a run that died before its
 * teardown leaves one in root's keys; it is taken out here, by the leftover
 * keypair's public key, before the keys are read.
 */
test.beforeAll(async ({ api }) => {
  const leftover = keypairKeys(await findSshKeypair(api, semiAutomaticKeypair)).publicKey?.trim();
  if (leftover) {
    const keys = await readRootAuthorizedKeys(api);
    const kept = keys.split('\n').filter((line) => line.trim() !== leftover).join('\n');
    if (kept !== keys) {
      await setRootAuthorizedKeys(api, kept);
    }
  }

  rootKeysFound = await readRootAuthorizedKeys(api);

  const ssh = await queryService(api, 'ssh');
  if (!ssh) {
    throw new Error('service.query returned no `ssh` row, so this file cannot tell what to restore.');
  }
  sshFound = ssh;

  await ensureServiceRunning(api, 'ssh', 'Discover Remote Host Key has nothing to scan');
});

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the SSH connections, their keypairs and root\'s added keys')) {
    return;
  }

  await cleanUp(api);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData('SSH as the semi-automatic setup left it')) {
    return;
  }

  await restoreService(api, 'ssh', sshFound, 'SSH stays as the semi-automatic setup left it');
});

test('a Manual connection with a discovered host key is stored with those settings', async ({ page, api }) => {
  await ensureSshKeypairPresent(api, manualKeypair);
  const keypair = await findSshKeypair(api, manualKeypair);
  await expectCardFits(api, 1);

  await openAddSshConnectionForm(page);
  await fillManualSshConnection(page, { name: manualName, host: loopbackHost, keypair: manualKeypair });
  const shownHostKey = await discoverRemoteHostKey(page);
  await saveSshConnectionForm(page);

  await expect(page.locator(sshConnectionLocators.card.name(manualName))).toHaveText(manualName);

  const attributes = sshConnectionAttributes(await findSshConnection(api, manualName));
  expect(attributes).toMatchObject({
    host: loopbackHost,
    port: 22,
    username: 'root',
    private_key: keypair?.id,
  });
  // The key Discover filled in is the key that was stored, not merely some key.
  expect(attributes?.remote_host_key.trim()).toBe(shownHostKey.trim());

  // An existing keypair was picked, so Generate New made nothing.
  expect(await findSshKeypair(api, `${manualName} Key`)).toBeUndefined();
});

test('a Semi-automatic connection to this system creates the connection and its keypair', async ({
  page, api, config,
}) => {
  await expectCardFits(api, 1);

  await openAddSshConnectionForm(page);
  await fillSemiAutomaticSshConnection(page, {
    name: semiAutomaticName,
    url: `http://${loopbackHost}`,
    adminUsername: config.username,
    adminPassword: config.password,
  });
  await saveSshConnectionForm(page);

  await expect(page.locator(sshConnectionLocators.card.name(semiAutomaticName))).toHaveText(semiAutomaticName);

  const keypair = await findSshKeypair(api, semiAutomaticKeypair);
  const publicKey = keypairKeys(keypair).publicKey?.trim();
  expect(publicKey, `Generate New made no keypair "${semiAutomaticKeypair}" with a public key`).toBeTruthy();

  const attributes = sshConnectionAttributes(await findSshConnection(api, semiAutomaticName));
  expect(attributes).toMatchObject({
    host: loopbackHost,
    port: (await readSshSettings(api)).tcpport,
    username: 'root',
    private_key: keypair?.id,
  });
  expect(attributes?.remote_host_key.trim()).not.toBe('');

  // The other half of the setup: the remote side, here this system, now lets root in with that key.
  const rootKeys = (await readRootAuthorizedKeys(api)).split('\n').map((line) => line.trim());
  expect(rootKeys).toContain(publicKey);
});

test('editing a connection changes that connection and leaves the other alone', async ({ page, api }) => {
  await ensureLoopbackSshConnectionPresent(api, editTarget);
  await ensureLoopbackSshConnectionPresent(api, editBystander);
  await expectCardFits(api, 0);
  const targetBefore = await findSshConnection(api, editTarget);
  const bystanderBefore = await findSshConnection(api, editBystander);

  await openEditSshConnectionForm(page, editTarget);
  await page.locator(sshConnectionLocators.form.connectTimeout).fill(String(editedConnectTimeout));
  await saveSshConnectionForm(page);

  await expect(page.locator(sshConnectionLocators.card.name(editTarget))).toHaveText(editTarget);

  expect(sshConnectionAttributes(await findSshConnection(api, editTarget))).toEqual({
    ...sshConnectionAttributes(targetBefore),
    connect_timeout: editedConnectTimeout,
  });

  // The whole point of the second connection: the card looks right either way.
  expect(await findSshConnection(api, editBystander)).toEqual(bystanderBefore);
});

test('deleting a connection with its keypair ticked removes both', async ({ page, api }) => {
  await ensureLoopbackSshConnectionPresent(api, deleteWithKeypair);
  await expectCardFits(api, 0);
  expect(await findSshKeypair(api, loopbackKeypairName(deleteWithKeypair))).toBeDefined();

  await deleteSshConnection(page, deleteWithKeypair, { deleteKeypair: true });

  // Polled rather than read once: a row can also be hidden while the table is between loads.
  await expect.poll(() => findSshConnection(api, deleteWithKeypair)).toBeUndefined();
  await expect.poll(() => findSshKeypair(api, loopbackKeypairName(deleteWithKeypair))).toBeUndefined();
});

test('deleting a connection with its keypair unticked leaves the keypair', async ({ page, api }) => {
  await ensureLoopbackSshConnectionPresent(api, deleteKeepKeypair);
  await expectCardFits(api, 0);

  await deleteSshConnection(page, deleteKeepKeypair, { deleteKeypair: false });

  await expect.poll(() => findSshConnection(api, deleteKeepKeypair)).toBeUndefined();
  expect(await findSshKeypair(api, loopbackKeypairName(deleteKeepKeypair))).toBeDefined();
});
