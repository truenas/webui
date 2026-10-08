/**
 * Stories: acting on a share from the list acts on the one you picked.
 *
 * An NFS row's actions collapse into a kebab menu, so an action belongs to
 * whichever row's menu was opened; each test runs beside a second share that
 * must come through untouched. Unsharing has a second claim: it removes the
 * *share* and leaves what is on the path, which a test that only checked the
 * row was gone could not tell from a delete that took the dataset with it.
 *
 * Two datasets where the SMB spec has one. An NFS share has no name — its path
 * is what tells it from the next — so two shares need two paths.
 */
import {
  ensureNfsServiceStopped, ensureNfsShareAbsent, ensureNfsSharePresent, findNfsShare,
} from '../fixtures/nfs';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, findDataset,
} from '../fixtures/storage';
import { openDeleteNfsShareDialog, openEditNfsShareForm, saveNfsShareForm } from '../flows/nfs';
import { confirmShareDeletion, formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset whose share each test acts on, and the one whose share must survive it. */
const targetDataset = 'e2e_list_nfs_target';
const bystanderDataset = 'e2e_list_nfs_bystander';

/** Descriptions the shares start with, so a change to either is visible as one. */
const targetDescription = 'Target share';
const bystanderDescription = 'Bystander share';

test.beforeEach(async ({ api, pool }) => {
  for (const dataset of [targetDataset, bystanderDataset]) {
    await ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`));
    await ensureDatasetPresent(api, `${pool}/${dataset}`);
  }

  // Both shares over the API: acting on one from the list is the thing under
  // test, so the shares themselves are a precondition.
  await ensureNfsSharePresent(api, {
    path: datasetMountPath(`${pool}/${targetDataset}`), comment: targetDescription,
  });
  await ensureNfsSharePresent(api, {
    path: datasetMountPath(`${pool}/${bystanderDataset}`), comment: bystanderDescription,
  });

  // The edit test saves the form, and what the form asks afterwards depends on
  // this: stopped, it offers to start the service, which `saveNfsShareForm` declines.
  await ensureNfsServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the NFS shares on, and datasets "${pool}/${targetDataset}" and "${pool}/${bystanderDataset}"`)) {
    return;
  }

  await runCleanupSteps([targetDataset, bystanderDataset].flatMap((dataset): [string, () => Promise<void>][] => [
    [`remove the share on ${dataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`))],
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, `${pool}/${dataset}`)],
  ]));
});

test('unsharing a path removes the share that was picked, and keeps the data', async ({ page, api, pool }) => {
  const target = datasetMountPath(`${pool}/${targetDataset}`);
  const bystander = datasetMountPath(`${pool}/${bystanderDataset}`);

  await openDeleteNfsShareDialog(page, { path: target, description: targetDescription });
  await confirmShareDeletion(page);

  await expect(page.locator(nfsLocators.card.row(target, targetDescription))).toBeHidden();

  expect(await findNfsShare(api, target)).toBeUndefined();
  // The whole point of the second share. A row-targeting bug does not throw —
  // it quietly unshares something nobody asked about, and the card looks right
  // either way.
  expect(await findNfsShare(api, bystander)).toBeDefined();
  await expect(page.locator(nfsLocators.card.row(bystander, bystanderDescription))).toBeVisible();

  // And the dataset is still there. Unsharing is not deleting, and a cleanup
  // that reached through to the data would be a very expensive surprise.
  expect(await findDataset(api, `${pool}/${targetDataset}`)).toBeDefined();
});

test('editing a share from the list changes the share that was picked', async ({ page, api, pool }) => {
  const target = datasetMountPath(`${pool}/${targetDataset}`);
  const bystander = datasetMountPath(`${pool}/${bystanderDataset}`);
  const edited = 'Edited from the list';

  await openEditNfsShareForm(page, { path: target, description: targetDescription });
  await page.locator(nfsLocators.form.comment).fill(edited);
  await saveNfsShareForm(page);

  // The card first: an edit that saved but left the row showing the old value
  // sends an admin back in to make a change that is already made. Looked up
  // under the *new* description, because the card builds a row's ids from it.
  await expect(page.locator(nfsLocators.card.description(target, edited)))
    .toHaveText(edited, { timeout: formSettleTimeoutMs });

  expect(await findNfsShare(api, target)).toMatchObject({
    comment: edited,
    // The edit form submits the whole share, not the field that changed, so
    // everything it loaded has to come back out the way it went in.
    path: target,
    enabled: true,
    ro: false,
    networks: [],
    hosts: [],
  });

  // Same reason as the bystander above: the panel opened from one row's menu.
  expect((await findNfsShare(api, bystander))?.comment).toBe(bystanderDescription);
});
