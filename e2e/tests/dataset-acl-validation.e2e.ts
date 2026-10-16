/**
 * Stories: the two ways the ACL editor stops or questions a save.
 *
 * An entry for a user with no user picked is invalid, and Save stays disabled
 * until it is removed, through the alert marker its row shows.
 *
 * The editor always asks middleware to validate the effective ACL, and
 * `filesystem.setacl` then fails when an ALLOW entry's user or group cannot
 * traverse a directory above the path. The editor answers that failure with a
 * "Traverse Access Warning": Cancel saves nothing, Save Anyway saves again
 * without the validation (`handleSaveError` in `dataset-acl-editor.store.ts`).
 * Here the directory above is mode 700 and owned by root, so nobody else can
 * traverse it; that includes the SMB preset's own builtin groups as well as the
 * user the test adds.
 *
 * Every result is read back through `filesystem.getacl`.
 */
import {
  findUserAclEntries, nfs4Entries, readAcl, setOwnership,
} from '../fixtures/permissions';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureSmbDatasetPresent,
} from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import {
  addAclUserEntry, openAclEditor, saveAclAnyway, saveAclToTraverseWarning,
} from '../flows/permissions';
import { confirmDialogLocators } from '../locators/dialogs';
import { permissionsLocators } from '../locators/permissions';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Made with the SMB preset, so the editor opens straight onto its entries. */
const invalidLeaf = 'e2e_acl_invalid';

/** A plain dataset that only root can traverse, once set up. */
const noexecLeaf = 'e2e_acl_noexec';

/** Made with the SMB preset under {@link noexecLeaf}. */
const innerLeaf = 'inner';

/** Throwaway user the traverse stories give Read. */
const aclUser = 'e2e_acl_noexec_user';

const aclEditor = permissionsLocators.aclEditor;

async function aclUserUid(api: E2eApiClient): Promise<number> {
  const uid = (await findUser(api, aclUser))?.uid;
  if (typeof uid !== 'number') {
    throw new Error(`User "${aclUser}" was created but cannot be found.`);
  }

  return uid;
}

test.beforeEach(async ({ api, pool }) => {
  const noexec = `${pool}/${noexecLeaf}`;

  // Absent first, so every story starts from the ACL the dataset is created with.
  await ensureDatasetAbsent(api, `${pool}/${invalidLeaf}`);
  await ensureDatasetAbsent(api, noexec);
  await ensureSmbDatasetPresent(api, `${pool}/${invalidLeaf}`);
  await ensureDatasetPresent(api, noexec);
  await ensureSmbDatasetPresent(api, `${noexec}/${innerLeaf}`);
  // Not recursive, so `inner` keeps its own NFSv4 ACL.
  await setOwnership(api, datasetMountPath(noexec), { user: 'root', group: 'root', mode: '700' });
  await ensureUserPresent(api, aclUser);
});

test.afterEach(async ({ api, pool }) => {
  const invalid = `${pool}/${invalidLeaf}`;
  const noexec = `${pool}/${noexecLeaf}`;
  if (leavingTestData(`datasets "${invalid}" and "${noexec}" and user "${aclUser}"`)) {
    return;
  }

  // Datasets first, so no ACL is left naming an account that no longer exists.
  // Both trees hold an NFSv4 dataset under a POSIX pool root, and
  // `smb-share-acl.e2e.ts` skips its root-share story while any such child exists.
  await runCleanupSteps([
    [`remove dataset ${invalid}`, () => ensureDatasetAbsent(api, invalid)],
    [`remove dataset ${noexec}`, () => ensureDatasetAbsent(api, noexec)],
    [`remove user ${aclUser}`, () => ensureUserAbsent(api, aclUser)],
  ]);
});

test('an entry without a user blocks Save until it is removed', async ({ page, api, pool }) => {
  const dataset = `${pool}/${invalidLeaf}`;
  const path = datasetMountPath(dataset);
  const before = nfs4Entries(await readAcl(api, path));
  const added = before.length;
  expect(added).toBeGreaterThan(0);

  await openAclEditor(page, dataset);
  const save = page.locator(aclEditor.save);
  // The preset's entries are valid, so it is the new entry that disables Save.
  await expect(save).toBeEnabled();

  await page.locator(aclEditor.addItem).click();
  await expect(page.locator(aclEditor.entry(added))).toBeVisible();
  // The entry form reports the new entry invalid while the list above it has
  // already rendered, so neither the marker nor the disabled Save shows until
  // the next event. Selecting the entry, as a user would to fill it in, is one.
  await page.locator(aclEditor.entry(added)).click();
  await expect(page.locator(aclEditor.entryError(added))).toBeVisible();
  await expect(save).toBeDisabled();

  await page.locator(aclEditor.entryError(added)).click();
  await expect(page.locator(aclEditor.entry(added))).toBeHidden();
  await expect(page.locator(aclEditor.entry(added - 1))).toBeVisible();
  await expect(save).toBeEnabled();

  await page.locator(aclEditor.cancel).click();
  await expect(save).toBeHidden();

  expect(nfs4Entries(await readAcl(api, path))).toEqual(before);
});

test('Cancel on the Traverse Access Warning saves nothing', async ({ page, api, pool }) => {
  const dataset = `${pool}/${noexecLeaf}/${innerLeaf}`;
  const path = datasetMountPath(dataset);
  const uid = await aclUserUid(api);
  const before = nfs4Entries(await readAcl(api, path));

  await openAclEditor(page, dataset);
  await addAclUserEntry(page, aclUser, 'Read');
  await saveAclToTraverseWarning(page);

  await page.locator(confirmDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  await expect(page.locator(aclEditor.save)).toBeVisible();

  expect(await findUserAclEntries(api, path, uid)).toEqual([]);
  expect(nfs4Entries(await readAcl(api, path))).toEqual(before);
});

test('Save Anyway on the Traverse Access Warning saves the entry', async ({ page, api, pool }) => {
  const dataset = `${pool}/${noexecLeaf}/${innerLeaf}`;
  const path = datasetMountPath(dataset);
  const uid = await aclUserUid(api);

  expect(await findUserAclEntries(api, path, uid)).toEqual([]);

  await openAclEditor(page, dataset);
  // Read rather than the new entry's default, Modify, so the stored value shows
  // the select was used.
  await addAclUserEntry(page, aclUser, 'Read');
  await saveAclToTraverseWarning(page);
  await saveAclAnyway(page);

  expect(await findUserAclEntries(api, path, uid)).toEqual([
    expect.objectContaining({ type: 'ALLOW', perms: { BASIC: 'READ' } }),
  ]);
});
