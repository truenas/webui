/**
 * Stories: an admin manages iSCSI portals, initiator groups and authorized
 * access from the full iSCSI page, and changes the global target configuration,
 * and the appliance holds what they did.
 *
 * Everything is read back through the `iscsi.*` queries. An edit or a delete
 * runs beside a second record of the same kind that must come through
 * untouched, since every row has its own Edit and Delete in its own menu.
 *
 * Portals: middleware refuses a listen address another portal already uses, so
 * the two portals a test makes listen on `0.0.0.0` and `::`, the two addresses
 * every appliance offers. Only `0.0.0.0` is ever picked in the UI.
 *
 * Global configuration: the base name and the listen port are never changed —
 * the base name is part of every target's IQN. The iSNS server is the appliance's
 * own HTTPS port on loopback, because Save is refused unless middleware can open
 * a connection to the server. ALUA (HA) and iSER (RDMA) are out of scope.
 */
import { findIscsiPortal } from '../fixtures/iscsi';
import {
  ensureIscsiAuthorizedAccessAbsent, ensureIscsiAuthorizedAccessPresent, ensureIscsiInitiatorGroupPresent,
  ensureIscsiInitiatorGroupsAbsent, ensureIscsiPortalPresent, ensureIscsiPortalsAbsent, findIscsiAuthorizedAccess,
  findIscsiInitiatorGroup, findIscsiInitiatorGroupsByComment, findIscsiPortalsByComment, readIscsiGlobalSettings,
  restoreIscsiGlobalSettings, type IscsiGlobalSettings,
} from '../fixtures/iscsi-config';
import {
  addIscsiInitiatorGroup, addIscsiMutualChapAccess, addIscsiPortal, deleteIscsiAuthorizedAccess, deleteIscsiPortal,
  editIscsiInitiatorGroup, editIscsiPortalDescription, saveIscsiGlobalConfiguration,
} from '../flows/iscsi-config';
import { iscsiConfigLocators } from '../locators/iscsi-config';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Portal comments. A renamed portal is found by its new comment, so both are cleaned up. */
const addedPortal = 'e2e-portal-added';
const editedPortal = 'e2e-portal-edited';
const renamedPortal = 'e2e-portal-renamed';
const deletedPortal = 'e2e-portal-deleted';
const bystanderPortal = 'e2e-portal-bystander';
const portalComments = [addedPortal, editedPortal, renamedPortal, deletedPortal, bystanderPortal];

/** Initiator group comments, the same way. */
const addedInitiators = 'e2e-initiators-added';
const editedInitiators = 'e2e-initiators-edited';
const renamedInitiators = 'e2e-initiators-renamed';
const initiatorComments = [addedInitiators, editedInitiators, renamedInitiators];

const iqnA = 'iqn.2005-10.org.example.e2e:initiator-a';
const iqnB = 'iqn.2005-10.org.example.e2e:initiator-b';

/** Authorized access users. Secrets are 12 to 16 characters, and a peer secret must differ from the secret. */
const chapUser = 'e2e-chap-user';
const chapPeer = 'e2e-chap-peer';
const deletedChapUser = 'e2e-chap-deleted';
const bystanderChapUser = 'e2e-chap-bystander';
const chapUsers = [chapUser, deletedChapUser, bystanderChapUser];

async function removeEverything(api: E2eApiClient): Promise<void> {
  const steps: CleanupStep[] = [
    ...portalComments.map((comment): CleanupStep => [
      `remove the iSCSI portal ${comment}`,
      () => ensureIscsiPortalsAbsent(api, comment),
    ]),
    ...initiatorComments.map((comment): CleanupStep => [
      `remove the iSCSI initiator group ${comment}`,
      () => ensureIscsiInitiatorGroupsAbsent(api, comment),
    ]),
    ...chapUsers.map((user): CleanupStep => [
      `remove the iSCSI authorized access for ${user}`,
      () => ensureIscsiAuthorizedAccessAbsent(api, user),
    ]),
  ];
  await runCleanupSteps(steps);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the next one able to start.
 *
 * The `pool` fixture is asked for, though nothing here is stored under it: the Shares dashboard
 * renders an empty state instead of its cards on an appliance with no pool, and the iSCSI card is
 * where the full page is opened from. Asking is the whole precondition; the name goes into the report
 * so a failure says which pool the dashboard was showing.
 */
test.beforeEach(async ({ api, pool }) => {
  test.info().annotations.push({ type: 'pool', description: pool });
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the iSCSI portals, initiator groups and authorized access entries named e2e-*')) {
    return;
  }

  await removeEverything(api);
});

test('an admin adds a portal with a listen address, and the appliance has it', async ({ page, api }) => {
  await addIscsiPortal(page, { comment: addedPortal, address: '0.0.0.0' });

  await expect(page.locator(iscsiConfigLocators.portals.description(addedPortal))).toHaveText(addedPortal);

  // Exactly one: a form that saved twice would make a second portal, or be refused for the address.
  const portals = await findIscsiPortalsByComment(api, addedPortal);
  expect(portals).toHaveLength(1);
  expect(portals[0]?.listen).toEqual([expect.objectContaining({ ip: '0.0.0.0' })]);
});

test('editing a portal changes only that portal', async ({ page, api }) => {
  const edited = await ensureIscsiPortalPresent(api, { comment: editedPortal, ip: '0.0.0.0' });
  const bystander = await ensureIscsiPortalPresent(api, { comment: bystanderPortal, ip: '::' });

  await editIscsiPortalDescription(page, editedPortal, renamedPortal);

  await expect(page.locator(iscsiConfigLocators.portals.description(renamedPortal))).toHaveText(renamedPortal);

  // The same portal, renamed, still listening where it did.
  const after = await findIscsiPortal(api, edited.id);
  expect(after).toMatchObject({ comment: renamedPortal });
  expect(after?.listen).toEqual([expect.objectContaining({ ip: '0.0.0.0' })]);

  expect(await findIscsiPortal(api, bystander.id)).toMatchObject({
    comment: bystanderPortal,
    listen: [expect.objectContaining({ ip: '::' })],
  });
});

test('deleting a portal removes only that portal', async ({ page, api }) => {
  const deleted = await ensureIscsiPortalPresent(api, { comment: deletedPortal, ip: '0.0.0.0' });
  const bystander = await ensureIscsiPortalPresent(api, { comment: bystanderPortal, ip: '::' });

  await deleteIscsiPortal(page, deletedPortal);

  // Polled: the row can also be hidden while the list reloads, which proves nothing.
  await expect.poll(() => findIscsiPortal(api, deleted.id)).toBeUndefined();
  await expect(page.locator(iscsiConfigLocators.portals.row(bystanderPortal).row)).toBeVisible();
  expect(await findIscsiPortal(api, bystander.id)).toMatchObject({ comment: bystanderPortal });
});

test('an admin adds an initiator group with typed IQNs, and the appliance has it', async ({ page, api }) => {
  await addIscsiInitiatorGroup(page, { comment: addedInitiators, iqns: [iqnA, iqnB] });

  const groups = await findIscsiInitiatorGroupsByComment(api, addedInitiators);
  expect(groups).toHaveLength(1);
  // Both IQNs, and nothing else — in particular not an empty list, which means "allow all".
  expect([...groups[0]?.initiators ?? []].sort((a, b) => a.localeCompare(b))).toEqual([iqnA, iqnB]);

  await expect(page.locator(iscsiConfigLocators.initiators.description(groups[0]?.id ?? -1)))
    .toHaveText(addedInitiators);
});

test('editing an initiator group from its row keeps the change', async ({ page, api }) => {
  const group = await ensureIscsiInitiatorGroupPresent(api, { comment: editedInitiators, initiators: [iqnA] });

  await editIscsiInitiatorGroup(page, {
    id: group.id,
    from: editedInitiators,
    to: renamedInitiators,
    addIqns: [iqnB],
  });

  await expect(page.locator(iscsiConfigLocators.initiators.description(group.id))).toHaveText(renamedInitiators);

  const after = await findIscsiInitiatorGroup(api, group.id);
  expect(after).toMatchObject({ comment: renamedInitiators });
  expect([...after?.initiators ?? []].sort((a, b) => a.localeCompare(b))).toEqual([iqnA, iqnB]);
});

test('an admin adds authorized access with CHAP and mutual CHAP, and the appliance has it', async ({ page, api }) => {
  const entry = {
    tag: 101,
    user: chapUser,
    secret: 'e2eChapSecret1',
    peeruser: chapPeer,
    peersecret: 'e2ePeerSecret2',
  };

  await addIscsiMutualChapAccess(page, entry);

  await expect(page.locator(iscsiConfigLocators.authorizedAccess.userCell(chapUser, chapPeer))).toHaveText(chapUser);

  expect(await findIscsiAuthorizedAccess(api, chapUser)).toMatchObject({
    ...entry,
    discovery_auth: 'CHAP_MUTUAL',
  });
});

test('deleting authorized access removes only that entry', async ({ page, api }) => {
  await ensureIscsiAuthorizedAccessPresent(api, {
    tag: 102,
    user: deletedChapUser,
    secret: 'e2eDelSecret01',
  });
  const bystander = await ensureIscsiAuthorizedAccessPresent(api, {
    tag: 103,
    user: bystanderChapUser,
    secret: 'e2eKeepSecret1',
  });

  // Made with no peer, so the row is keyed by the user alone.
  await deleteIscsiAuthorizedAccess(page, deletedChapUser, '');

  await expect.poll(() => findIscsiAuthorizedAccess(api, deletedChapUser)).toBeUndefined();
  expect(await findIscsiAuthorizedAccess(api, bystanderChapUser)).toMatchObject({ id: bystander.id });
});

/**
 * The global configuration is one record. What a test found is read before it
 * and written back after it, so an appliance someone has set up keeps its setup.
 */
test.describe('the global target configuration', () => {
  const isnsServer = '127.0.0.1:443';
  const poolAvailThreshold = 80;
  let original: IscsiGlobalSettings | undefined;

  test.beforeAll(async ({ api }) => {
    original = await readIscsiGlobalSettings(api);
  });

  test.afterEach(async ({ api }) => {
    if (!original || leavingTestData('the iSCSI global configuration as the test left it')) {
      return;
    }

    await restoreIscsiGlobalSettings(api, original);
  });

  test('an admin adds an iSNS server and a pool threshold, and the appliance keeps them', async ({ page, api }) => {
    const before = await readIscsiGlobalSettings(api);

    await saveIscsiGlobalConfiguration(page, { basename: before.basename, isnsServer, poolAvailThreshold });

    expect(await readIscsiGlobalSettings(api)).toEqual({
      basename: before.basename,
      listen_port: before.listen_port,
      isns_servers: [...before.isns_servers, isnsServer],
      pool_avail_threshold: poolAvailThreshold,
    });
  });
});
