/**
 * Stories: adding, editing and removing NFSv4 ACL entries in the dataset ACL editor.
 *
 * `smb-share-acl.e2e.ts` covers one entry, a user with a basic permission and the default flags.
 * These cover a group entry of type Deny, an entry with advanced permissions and advanced flags,
 * editing an entry already in the ACL, and removing one.
 *
 * Every story starts from a dataset made with the SMB preset, whose ACL is not trivial, so Edit on
 * the Permissions card opens the editor straight onto its entries. Each result is read back
 * through `filesystem.getacl`, which stores ids rather than names, so entries are matched by id.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import { findUserAclEntries, readAcl } from '../fixtures/permissions';
import {
  datasetMountPath, ensureDatasetAbsent, ensureSmbDatasetPresent, type Nfs4Ace,
} from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import {
  addAclGroupEntry,
  addAclUserEntry,
  openAclEditor,
  removeAce,
  saveAcl,
  selectAce,
  setAceType,
  setAdvancedFlags,
  setAdvancedPermissions,
  setBasicFlag,
  setBasicPermission,
} from '../flows/permissions';
import { permissionsLocators } from '../locators/permissions';
import { datasetDetailsLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Made with the SMB preset, so its ACL names `owner@`, `group@`, `builtin_users` and `builtin_administrators`. */
const leaf = 'e2e_acl_entries';

/** Throwaway accounts for the new entries to name. */
const aclUser = 'e2e_acl_entry_user';
const aclGroup = 'e2e_acl_entry_group';

/** Every key an advanced NFSv4 permission set has (`NfsAdvancedPermission` in `src/app/enums/nfs-acl.enum.ts`). */
const advancedPermissionKeys = [
  'READ_DATA',
  'WRITE_DATA',
  'APPEND_DATA',
  'READ_NAMED_ATTRS',
  'WRITE_NAMED_ATTRS',
  'EXECUTE',
  'DELETE_CHILD',
  'READ_ATTRIBUTES',
  'WRITE_ATTRIBUTES',
  'DELETE',
  'READ_ACL',
  'WRITE_ACL',
  'WRITE_OWNER',
  'SYNCHRONIZE',
];

/**
 * What the advanced-permissions story ticks, by label and by the key it stores.
 *
 * Not a basic set: READ also has Read Named Attributes and TRAVERSE drops Read Data, so
 * `filesystem.getacl` cannot fold it back into a `BASIC` value.
 */
const tickedPermissions = new Map([
  ['Read Data', 'READ_DATA'],
  ['Execute', 'EXECUTE'],
  ['Read Attributes', 'READ_ATTRIBUTES'],
  ['Read ACL', 'READ_ACL'],
  ['Synchronize', 'SYNCHRONIZE'],
]);

/** The entries of `path`'s ACL. Throws on anything but NFSv4, which would mean the wrong dataset. */
async function entriesOf(api: E2eApiClient, path: string): Promise<Nfs4Ace[]> {
  const acl = await readAcl(api, path);
  if (acl.acltype !== 'NFS4') {
    throw new Error(`"${path}" has ${acl.acltype} ACLs, where the test expects the NFSv4 the SMB preset gives.`);
  }
  return acl.acl;
}

/** The gid of `name`. Throws when the group does not exist, which would make every match below vacuous. */
async function gidOf(api: E2eApiClient, name: string): Promise<number> {
  const group = await findGroup(api, name);
  if (!group) {
    throw new Error(`Group "${name}" does not exist.`);
  }
  return group.gid;
}

/** The uid of `username`, narrowed the same way: the generated record declares it optional. */
async function uidOf(api: E2eApiClient, username: string): Promise<number> {
  const uid = (await findUser(api, username))?.uid;
  if (typeof uid !== 'number') {
    throw new Error(`User "${username}" was created but cannot be found.`);
  }
  return uid;
}

/** An entry as the ticket names it: its tag and, for USER and GROUP, the id it grants to. */
function identityOf(entry: Nfs4Ace): string {
  return `${entry.tag}:${String(entry.id)}`;
}

// The user and group are created once for the file: they only stand in for ACL entries here, and
// the user costs middleware about a second to create and another to delete. A failed test restarts
// the worker, which runs `afterAll` and then this again, so a retry starts clean.
test.beforeAll(async ({ api }) => {
  await ensureUserPresent(api, aclUser);
  await ensureGroupPresent(api, aclGroup);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`user "${aclUser}" and group "${aclGroup}"`)) {
    return;
  }

  // `afterEach` has already removed the dataset, so no ACL is left naming an account that no
  // longer exists.
  await runCleanupSteps([
    [`remove user ${aclUser}`, () => ensureUserAbsent(api, aclUser)],
    [`remove group ${aclGroup}`, () => ensureGroupAbsent(api, aclGroup)],
  ]);
});

test.beforeEach(async ({ api, pool }) => {
  // Absent first, so every story starts from the ACL the SMB preset gives.
  await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  await ensureSmbDatasetPresent(api, `${pool}/${leaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  if (leavingTestData(`dataset "${dataset}"`)) {
    return;
  }

  // It is an NFSv4 dataset under a POSIX pool root, and `smb-share-acl.e2e.ts`
  // skips its root-share story while any such child exists.
  await runCleanupSteps([
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('a Group entry of type Deny is saved for that group', async ({ page, api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  const path = datasetMountPath(dataset);
  const gid = await gidOf(api, aclGroup);
  const forGroup = (entries: Nfs4Ace[]): Nfs4Ace[] => entries.filter(
    (entry) => entry.tag === 'GROUP' && entry.id === gid,
  );

  expect(forGroup(await entriesOf(api, path))).toHaveLength(0);

  await openAclEditor(page, dataset);
  await addAclGroupEntry(page, aclGroup, 'Read');
  await setAceType(page, 'Deny');
  await saveAcl(page);

  expect(forGroup(await entriesOf(api, path))).toEqual([
    expect.objectContaining({
      type: 'DENY',
      perms: { BASIC: 'READ' },
      flags: { BASIC: 'INHERIT' },
    }),
  ]);
});

test('advanced permissions and advanced flags are saved bit by bit', async ({ page, api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  const path = datasetMountPath(dataset);
  const uid = await uidOf(api, aclUser);

  expect(await findUserAclEntries(api, path, uid)).toHaveLength(0);

  await openAclEditor(page, dataset);
  await addAclUserEntry(page, aclUser, 'Read');
  await setAdvancedPermissions(page, [...tickedPermissions.keys()]);
  await setAdvancedFlags(page, ['Directory Inherit']);
  await saveAcl(page);

  const entries = await findUserAclEntries(api, path, uid);
  expect(entries).toHaveLength(1);
  const perms = entries[0]?.perms as Record<string, unknown> | undefined;
  const flags = entries[0]?.flags as Record<string, unknown> | undefined;

  // Every key, so a box left ticked by mistake shows up as well as one that did not land. A key
  // middleware leaves out is a clear box, the same as `false`.
  const ticked = new Set(tickedPermissions.values());
  expect(Object.fromEntries(advancedPermissionKeys.map((key) => [key, perms?.[key] ?? false])))
    .toEqual(Object.fromEntries(advancedPermissionKeys.map((key) => [key, ticked.has(key)])));
  expect(flags?.DIRECTORY_INHERIT).toBe(true);
  expect(flags?.FILE_INHERIT ?? false).toBe(false);

  // Saving returns to the dataset. More than one advanced bit reads as Special on the card.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);
  await expect(page.locator(permissionsLocators.card.entry(`User - ${aclUser}`))).toHaveText('Allow | Special');
});

test('editing group@ in place changes that entry and no other', async ({ page, api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  const path = datasetMountPath(dataset);
  const before = await entriesOf(api, path);
  const index = before.findIndex((entry) => entry.tag === 'group@');

  // The edit has to be a change, or the assertions below would pass on a save that did nothing.
  expect(index).toBeGreaterThanOrEqual(0);
  expect(before[index]).not.toMatchObject({ perms: { BASIC: 'READ' }, flags: { BASIC: 'NOINHERIT' } });

  await openAclEditor(page, dataset);
  await selectAce(page, index, 'group@');
  await setBasicPermission(page, 'Read');
  await setBasicFlag(page, 'No Inherit');
  await saveAcl(page);

  const after = await entriesOf(api, path);
  expect(after).toHaveLength(before.length);
  expect(after.find((entry) => entry.tag === 'group@')).toMatchObject({
    perms: { BASIC: 'READ' },
    flags: { BASIC: 'NOINHERIT' },
  });
  // owner@ came through unchanged, so the edit landed on group@'s row and not the one selected before.
  expect(after.find((entry) => entry.tag === 'owner@')).toEqual(before.find((entry) => entry.tag === 'owner@'));
});

test('removing the builtin_users entry leaves every other entry in order', async ({ page, api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  const path = datasetMountPath(dataset);
  const builtinUsers = await gidOf(api, 'builtin_users');
  const isBuiltinUsers = (entry: Nfs4Ace): boolean => entry.tag === 'GROUP' && entry.id === builtinUsers;
  const before = await entriesOf(api, path);
  const index = before.findIndex(isBuiltinUsers);

  expect(index).toBeGreaterThanOrEqual(0);

  await openAclEditor(page, dataset);
  await removeAce(page, index);
  await saveAcl(page);

  // Both checks, because removing the wrong row or saving an empty list would pass the first alone.
  const after = await entriesOf(api, path);
  expect(after.some(isBuiltinUsers)).toBe(false);
  expect(after.map(identityOf)).toEqual(before.filter((_, position) => position !== index).map(identityOf));
});
