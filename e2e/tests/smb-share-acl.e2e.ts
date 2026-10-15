/**
 * Stories: the two ACL actions in an SMB share's row menu.
 *
 * Edit Share ACL edits the share's own ACL, which SMB checks before the
 * filesystem is asked anything. Its stories add an entry and remove one, and
 * each is asserted through `sharing.smb.getacl`. Edit Filesystem ACL opens the
 * dataset ACL editor on the share's path. Its story saves one entry there and
 * reads it back through `filesystem.getacl`. The editor itself is a separate
 * story, so this one goes no further than one entry.
 *
 * The share sits on a dataset made with the SMB preset, which gives it an
 * NFSv4 ACL that is not trivial. A trivial one would open the editor on a
 * preset picker instead of the entries.
 */
import { findUserAclEntries } from '../fixtures/permissions';
import {
  ensureSmbShareAbsent, ensureSmbSharePresent, everyoneSid, readSmbShareAcl, setSmbShareAclWithUser,
  type SmbShareAce,
} from '../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureSmbDatasetPresent, findMixedAclChildren,
} from '../fixtures/storage';
import { ensureSmbUserPresent, ensureUserAbsent, findUser } from '../fixtures/users';
import { addAclUserEntry, saveAcl } from '../flows/permissions';
import {
  addShareAclUserEntry, openShareAclForm, openShareActions, openShareFilesystemAcl, removeShareAclEntry, saveShareAcl,
} from '../flows/smb';
import { permissionsLocators } from '../locators/permissions';
import { smbLocators } from '../locators/smb';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The share every story acts on. */
const share = 'e2e_acl_share';

/** A share on the pool's root, where Edit Filesystem ACL is not offered. */
const rootShare = 'e2e_acl_root_share';

/** Under the shared pool, made with the SMB preset. */
const datasetLeaf = 'e2e_acl_smb_ds';

/** The user every entry names. The share ACL picker lists SMB users only. */
const smbUser = {
  username: 'e2e_acl_user',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'E2E-Acl-Passw0rd!',
};

/** The uid the appliance gave {@link smbUser}, which is what both kinds of ACL store. */
async function smbUserUid(api: E2eApiClient): Promise<number> {
  const uid = (await findUser(api, smbUser.username))?.uid;
  if (typeof uid !== 'number') {
    throw new Error(`User "${smbUser.username}" was created but cannot be found.`);
  }

  return uid;
}

/** Whether a share ACL entry names the user with `uid`. */
function namesUser(entry: SmbShareAce, uid: number): boolean {
  return entry.ae_who_id?.id_type === 'USER' && entry.ae_who_id.id === uid;
}

/** The share ACL entries that name the user with `uid`. */
function entriesFor(acl: SmbShareAce[], uid: number): SmbShareAce[] {
  return acl.filter((entry) => namesUser(entry, uid));
}

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;

  await ensureSmbShareAbsent(api, share);
  await ensureSmbShareAbsent(api, rootShare);
  // Absent first, so every story starts from the ACL the preset gives.
  await ensureDatasetAbsent(api, dataset);
  await ensureSmbDatasetPresent(api, dataset);
  await ensureSmbUserPresent(api, smbUser);
  await ensureSmbSharePresent(api, { name: share, path: datasetMountPath(dataset) });
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  if (leavingTestData(`shares "${share}" and "${rootShare}", dataset "${dataset}" and user "${smbUser.username}"`)) {
    return;
  }

  // Shares before the dataset they point at, and the user last, so no ACL is
  // left naming an account that no longer exists.
  await runCleanupSteps([
    [`remove share ${share}`, () => ensureSmbShareAbsent(api, share)],
    [`remove share ${rootShare}`, () => ensureSmbShareAbsent(api, rootShare)],
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
    [`remove user ${smbUser.username}`, () => ensureUserAbsent(api, smbUser.username)],
  ]);
});

test('an entry added in Edit Share ACL is what the appliance stores', async ({ page, api }) => {
  const uid = await smbUserUid(api);

  // Without this the assertion below could pass on an entry that was already there.
  expect(entriesFor(await readSmbShareAcl(api, share), uid)).toEqual([]);

  await openShareAclForm(page, share);
  await addShareAclUserEntry(page, {
    username: smbUser.username,
    permission: 'FULL',
    type: 'ALLOWED',
  });
  await saveShareAcl(page);

  expect(entriesFor(await readSmbShareAcl(api, share), uid)).toEqual([
    expect.objectContaining({ ae_perm: 'FULL', ae_type: 'ALLOWED' }),
  ]);
});

test('an entry removed in Edit Share ACL is gone from what the appliance stores', async ({ page, api }) => {
  const uid = await smbUserUid(api);
  await setSmbShareAclWithUser(api, share, uid);

  // The form lists the entries in the order the appliance stores them, so this
  // is the row that holds the user.
  const before = await readSmbShareAcl(api, share);
  const index = before.findIndex((entry) => namesUser(entry, uid));
  expect(index).toBeGreaterThanOrEqual(0);

  await openShareAclForm(page, share);
  await expect(page.locator(smbLocators.shareAcl.who)).toHaveCount(before.length);
  await removeShareAclEntry(page, index);
  await saveShareAcl(page);

  const after = await readSmbShareAcl(api, share);
  expect(entriesFor(after, uid)).toEqual([]);
  // The other entry has to survive. Removing the wrong row, or saving an empty
  // list, would also leave the user out.
  expect(after.map((entry) => entry.ae_who_sid)).toContain(everyoneSid);
});

test('Edit Filesystem ACL opens the share path and saves an entry to it', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetLeaf}`);
  const uid = await smbUserUid(api);

  expect(await findUserAclEntries(api, path, uid)).toEqual([]);

  await openShareFilesystemAcl(page, share);
  await expect(page.locator(permissionsLocators.aclEditor.path)).toHaveText(path);

  // Read rather than the new entry's default, Modify, so the stored value shows
  // the select was used.
  await addAclUserEntry(page, smbUser.username, 'Read');
  await saveAcl(page);

  expect(await findUserAclEntries(api, path, uid)).toEqual([
    expect.objectContaining({ type: 'ALLOW', perms: { BASIC: 'READ' } }),
  ]);
});

test('Edit Filesystem ACL is disabled for a share on a pool root', async ({ page, api, pool }) => {
  // Middleware refuses a share whose path holds a child dataset of another ACL
  // type, and the SMB preset dataset is NFSv4 under a POSIX pool root. So that
  // dataset, and the share on it, go before the root share can exist.
  await ensureSmbShareAbsent(api, share);
  await ensureDatasetAbsent(api, `${pool}/${datasetLeaf}`);
  // A developer's own pool can hold other such datasets, and those are not this
  // spec's to remove.
  const mixed = await findMixedAclChildren(api, pool);
  test.skip(
    mixed.length > 0,
    `Pool "${pool}" holds datasets with another ACL type than its root (${mixed.join(', ')}), `
    + 'so middleware refuses a share on the root.',
  );
  await ensureSmbSharePresent(api, { name: rootShare, path: datasetMountPath(pool) });

  await openShareActions(page, rootShare);
  await expect(page.locator(smbLocators.card.rowMenuFilesystemAcl(rootShare))).toBeDisabled();
  // The same menu still offers Edit Share ACL, so the rule is about the
  // filesystem action and not the whole menu. That it is about the root, and
  // not every share, is the story above: it clicks the action on a dataset.
  await expect(page.locator(smbLocators.card.rowMenuShareAcl(rootShare))).toBeEnabled();
});
