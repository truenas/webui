/**
 * Stories: acting on a share from the list acts on the one you picked.
 *
 * Unsharing first, then editing.
 *
 * Two claims, and the second is the one an admin would most regret being wrong.
 * Deleting an SMB share removes the *share*; what is on the path is untouched
 * by design. A test that only checked the row was gone could not tell that
 * apart from a delete that took the dataset with it.
 *
 * The row-targeting half is the same claim the users and groups specs make, and
 * it reaches it differently again: an SMB row's actions collapse into a kebab
 * menu, so the delete belongs to whichever row's menu was opened.
 */
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
} from '../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, findDataset,
} from '../fixtures/storage';
import {
  confirmShareDeletion, openDeleteShareDialog, openEditShareForm, saveShareForm,
} from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { expect, test } from '../support/fixtures';

/** The share each test deletes, and the one that must survive it. */
const target = 'e2e_delete_share';
const bystander = 'e2e_delete_bystander_share';

/** One dataset under both shares, so deletion has data to leave behind. */
const datasetName = 'e2e_delete_smb_ds';

test.beforeEach(async ({ api, pool }) => {
  await ensureSmbShareAbsent(api, target);
  await ensureSmbShareAbsent(api, bystander);
  await ensureDatasetPresent(api, `${pool}/${datasetName}`);
  // The edit test saves the form, and what the form asks afterwards depends on
  // this: stopped, it offers to start the service, which `saveShareForm` declines.
  await ensureSmbServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  await ensureSmbShareAbsent(api, target);
  await ensureSmbShareAbsent(api, bystander);
  await ensureDatasetAbsent(api, `${pool}/${datasetName}`);
});

test('unsharing a path removes the share that was picked, and keeps the data', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const path = datasetMountPath(dataset);

  // Both over the API: the deletion is the thing under test, so the shares
  // themselves are a precondition (R3.1).
  await ensureSmbSharePresent(api, { name: target, path });
  await ensureSmbSharePresent(api, { name: bystander, path });

  await openDeleteShareDialog(page, target);
  await confirmShareDeletion(page);

  await expect(page.locator(smbLocators.card.row(target))).toBeHidden();

  expect(await findSmbShare(api, target)).toBeUndefined();
  // The whole point of the second share. A row-targeting bug does not throw —
  // it quietly unshares something nobody asked about, and the card looks right
  // either way.
  expect(await findSmbShare(api, bystander)).toBeDefined();
  await expect(page.locator(smbLocators.card.row(bystander))).toBeVisible();

  // And the dataset is still there. Unsharing is not deleting, and a cleanup
  // that reached through to the data would be a very expensive surprise.
  expect(await findDataset(api, dataset)).toBeDefined();
});

test('editing a share from the list changes the share that was picked', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  const description = 'Edited from the list';

  await ensureSmbSharePresent(api, { name: target, path });
  await ensureSmbSharePresent(api, { name: bystander, path });

  await openEditShareForm(page, target);
  await page.locator(smbLocators.form.comment).fill(description);
  await saveShareForm(page);

  // The card first: an edit that saved but left the row showing the old value
  // sends an admin back in to make a change that is already made.
  await expect(page.locator(smbLocators.card.description(target))).toHaveText(description);

  const saved = await findSmbShare(api, target);
  expect(saved).toMatchObject({
    comment: description,
    // The edit form submits the whole share, not the field that changed, so
    // everything it loaded has to come back out the way it went in.
    name: target,
    path,
    enabled: true,
    purpose: 'DEFAULT_SHARE',
  });

  // Same reason as the bystander above: the panel opened from one row's menu.
  expect((await findSmbShare(api, bystander))?.comment).toBe('');
});
