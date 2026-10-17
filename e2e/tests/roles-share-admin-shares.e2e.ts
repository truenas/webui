/**
 * Story: the built-in sharing administrator manages shares from the Shares
 * dashboard's SMB, NFS and iSCSI cards. They add an SMB share and delete
 * another, edit an NFS share and switch it off, and delete an iSCSI target, and
 * the appliance holds each change.
 *
 * The positive side of `roles-read-only-shares.e2e.ts`: the controls the
 * read-only admin finds locked are the ones this account must be able to use.
 * `expectUnlockedByRole` checks the ones that can carry the role-missing
 * wrapper; the row-menu items never do, so using them is the check.
 *
 * Two tests, so the account signs in twice: every sign-in spends from the
 * unauthenticated rate limit (see `flows/roles.ts`).
 *
 * The three services are stopped first, as the other share specs stop them.
 * The saves answer the "Start Service" offer, which is only raised while the
 * service is stopped, and decline it, so the services stay stopped.
 */
import {
  ensureIscsiServiceStopped, ensureIscsiShareAbsent, ensureIscsiSharePresent, findIscsiExtent, findIscsiTarget,
} from '../fixtures/iscsi';
import {
  ensureNfsServiceStopped, ensureNfsShareAbsent, ensureNfsSharePresent, findNfsShare,
} from '../fixtures/nfs';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
} from '../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureSmbDatasetPresent, ensureZvolPresent,
} from '../fixtures/storage';
import { deleteIscsiTargetWithExtents } from '../flows/iscsi';
import { goToShares } from '../flows/navigation';
import { openEditNfsShareForm, saveNfsShareForm, toggleNfsShareEnabled } from '../flows/nfs';
import { expectUnlockedByRole, signInAsRoleAdmin } from '../flows/roles';
import {
  confirmShareDeletion, formSettleTimeoutMs, openAddShareForm, openDeleteShareDialog, saveNewShareFormDecliningAcl,
} from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.sharing;

/** Created through the form, never over the API — that is the thing under test. */
const newSmbShare = 'e2e_sa_smb_new';
/** Seeded over the API, so there is a share to delete. */
const deletedSmbShare = 'e2e_sa_smb_del';

const nfsLeaf = 'e2e_sa_nfs';
const seededNfsComment = 'seeded';
const editedNfsComment = 'edited by share admin';

/** The target, its extent and the zvol under it all take this name. */
const iscsiTarget = 'e2e-sa-target';

test.describe('as a sharing administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api, pool }) => {
    const nfsDataset = `${pool}/${nfsLeaf}`;
    const zvol = `${pool}/${iscsiTarget}`;

    await ensureRoleAdminAbsent(api, account);
    await ensureSmbShareAbsent(api, newSmbShare);
    await ensureSmbShareAbsent(api, deletedSmbShare);
    await ensureNfsShareAbsent(api, datasetMountPath(nfsDataset));
    await ensureIscsiShareAbsent(api, iscsiTarget);

    await ensureSmbServiceStopped(api);
    await ensureNfsServiceStopped(api);
    await ensureIscsiServiceStopped(api);

    // The SMB preset gives each dataset a non-trivial ACL, which is what makes the
    // form ask "Configure ACL" after the new share is saved.
    await ensureSmbDatasetPresent(api, `${pool}/${newSmbShare}`);
    await ensureSmbDatasetPresent(api, `${pool}/${deletedSmbShare}`);
    await ensureSmbSharePresent(api, {
      name: deletedSmbShare,
      path: datasetMountPath(`${pool}/${deletedSmbShare}`),
    });
    await ensureDatasetPresent(api, nfsDataset);
    await ensureNfsSharePresent(api, { path: datasetMountPath(nfsDataset), comment: seededNfsComment });
    await ensureZvolPresent(api, zvol);
    await ensureIscsiSharePresent(api, { name: iscsiTarget, zvol });
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api, pool }) => {
    const nfsDataset = `${pool}/${nfsLeaf}`;
    const zvol = `${pool}/${iscsiTarget}`;
    if (leavingTestData(`user "${account.username}", its shares, iSCSI target and datasets`)) {
      return;
    }

    // Shares before the datasets they point at, so nothing is left exporting a missing path.
    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
      [`remove SMB share ${newSmbShare}`, () => ensureSmbShareAbsent(api, newSmbShare)],
      [`remove SMB share ${deletedSmbShare}`, () => ensureSmbShareAbsent(api, deletedSmbShare)],
      [`remove NFS share on ${nfsDataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(nfsDataset))],
      [`remove iSCSI share ${iscsiTarget}`, () => ensureIscsiShareAbsent(api, iscsiTarget)],
      [`remove dataset ${pool}/${newSmbShare}`, () => ensureDatasetAbsent(api, `${pool}/${newSmbShare}`)],
      [`remove dataset ${pool}/${deletedSmbShare}`, () => ensureDatasetAbsent(api, `${pool}/${deletedSmbShare}`)],
      [`remove dataset ${nfsDataset}`, () => ensureDatasetAbsent(api, nfsDataset)],
      [`remove zvol ${zvol}`, () => ensureDatasetAbsent(api, zvol)],
    ]);
  });

  test('the SMB card lets them add a share and delete another', async ({ page, api, pool }) => {
    const newPath = datasetMountPath(`${pool}/${newSmbShare}`);

    await signInAsRoleAdmin(page, account);

    await test.step('add a share', async () => {
      await goToShares(page);
      await expect(page.locator(smbLocators.addShare)).toBeVisible({ timeout: formSettleTimeoutMs });
      await expectUnlockedByRole(page, smbLocators.addShare);

      await openAddShareForm(page);
      await page.locator(smbLocators.form.path).fill(newPath);
      await page.locator(smbLocators.form.name).fill(newSmbShare);
      await saveNewShareFormDecliningAcl(page);

      await expect(page.locator(smbLocators.card.row(newSmbShare))).toBeVisible({ timeout: formSettleTimeoutMs });
      expect(await findSmbShare(api, newSmbShare)).toMatchObject({ name: newSmbShare, path: newPath, enabled: true });
    });

    await test.step('delete a share', async () => {
      // Through the row menu's Delete, which is a disabled menu item for the read-only admin.
      await openDeleteShareDialog(page, deletedSmbShare);
      await confirmShareDeletion(page);

      await expect.poll(() => findSmbShare(api, deletedSmbShare)).toBeUndefined();
      // The share added in the step before is a different row, and must survive.
      expect(await findSmbShare(api, newSmbShare)).toBeDefined();
    });
  });

  test('the NFS and iSCSI cards let them edit, switch off and delete', async ({ page, api, pool }) => {
    const nfsPath = datasetMountPath(`${pool}/${nfsLeaf}`);
    const seededNfsShare = await findNfsShare(api, nfsPath);
    expect(seededNfsShare).toMatchObject({ comment: seededNfsComment, enabled: true });

    await signInAsRoleAdmin(page, account);

    await test.step('edit an NFS share and switch it off', async () => {
      await openEditNfsShareForm(page, { path: nfsPath, description: seededNfsComment });
      await page.locator(nfsLocators.form.comment).fill(editedNfsComment);
      await saveNfsShareForm(page);

      // The card builds a row's ids from its description, so the row is looked up
      // under the new one. Its text says the card has reloaded the edited share,
      // which the switch below reads its current value from.
      const editedRow = { path: nfsPath, description: editedNfsComment };
      await expect(page.locator(nfsLocators.card.description(nfsPath, editedNfsComment)))
        .toHaveText(editedNfsComment, { timeout: formSettleTimeoutMs });
      expect((await findNfsShare(api, nfsPath))?.comment).toBe(editedNfsComment);

      await expectUnlockedByRole(page, nfsLocators.card.enabledToggle(nfsPath, editedNfsComment));
      await toggleNfsShareEnabled(page, editedRow);

      await expect.poll(async () => (await findNfsShare(api, nfsPath))?.enabled).toBe(false);
      // The same record, updated in place: not deleted and created again.
      expect(await findNfsShare(api, nfsPath)).toMatchObject({
        id: seededNfsShare?.id,
        comment: editedNfsComment,
        enabled: false,
      });
    });

    await test.step('delete an iSCSI target and its extent', async () => {
      expect(await findIscsiExtent(api, iscsiTarget)).toBeDefined();

      await deleteIscsiTargetWithExtents(page, iscsiTarget);

      await expect.poll(() => findIscsiTarget(api, iscsiTarget)).toBeUndefined();
      expect(await findIscsiExtent(api, iscsiTarget)).toBeUndefined();
    });
  });
});
