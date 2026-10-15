/**
 * Stories: the standalone NFS list, reached from the title of the card on the
 * Shares dashboard.
 *
 * The list has its own search and its own Add (`add-nfs-share`, not the card's
 * `nfs-share-add`), and neither is on the card, so the card's specs say nothing
 * about them. Acting on a row from the card is `nfs-list.e2e.ts`.
 *
 * Every share gets its own dataset, since a path is what tells one NFS share
 * from another, and a fixed description, since a row's ids are built from both.
 */
import {
  ensureNfsServiceStopped, ensureNfsShareAbsent, ensureNfsSharePresent, findNfsShare,
} from '../fixtures/nfs';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  fillNfsSharePath, openAddNfsShareFormFromList, openNfsListPage, saveNfsShareForm, searchNfsList,
} from '../flows/nfs';
import { formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The share the search looks for, by its dataset name. No other share's path or description holds it. */
const searchTarget = { dataset: 'e2e_nfs_page_b', description: 'NFS page share B' };

/** The shares the list starts with, by dataset and description. */
const listedShares = [
  { dataset: 'e2e_nfs_page_a', description: 'NFS page share A' },
  searchTarget,
  { dataset: 'e2e_nfs_page_c', description: 'NFS page share C' },
];

/** The share the list page's Add creates. */
const addedShare = { dataset: 'e2e_nfs_page_added', description: 'Added from the list' };

const allShares = [...listedShares, addedShare];

test.beforeEach(async ({ api, pool }) => {
  for (const { dataset } of allShares) {
    await ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`));
    await ensureDatasetPresent(api, `${pool}/${dataset}`);
  }

  // The add test saves the form, and what the form asks afterwards depends on
  // this: stopped, it offers to start the service, which `saveNfsShareForm` declines.
  await ensureNfsServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the NFS shares on, and datasets "${pool}/e2e_nfs_page_*"`)) {
    return;
  }

  await runCleanupSteps(allShares.flatMap(({ dataset }): [string, () => Promise<void>][] => [
    [`remove the share on ${dataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`))],
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, `${pool}/${dataset}`)],
  ]));
});

test('the card title opens the full NFS list, which searches down to one share', async ({ page, api, pool }) => {
  // Over the API: the list is the thing under test, so the shares are a precondition.
  for (const { dataset, description } of listedShares) {
    await ensureNfsSharePresent(api, { path: datasetMountPath(`${pool}/${dataset}`), comment: description });
  }

  await openNfsListPage(page);

  for (const { dataset, description } of listedShares) {
    await expect(page.locator(nfsLocators.list.row(datasetMountPath(`${pool}/${dataset}`), description)))
      .toBeVisible({ timeout: formSettleTimeoutMs });
  }

  await searchNfsList(page, searchTarget.dataset);

  // Exactly one row is left, and it is the one searched for. Checking only that
  // the others went would pass a search that also left a share from another spec.
  const targetPath = datasetMountPath(`${pool}/${searchTarget.dataset}`);
  await expect(page.locator(nfsLocators.list.row(targetPath, searchTarget.description))).toBeVisible();
  await expect(page.locator(nfsLocators.list.anyRow)).toHaveCount(1);
});

test('Add on the list page creates the share on the appliance', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${addedShare.dataset}`);

  await openNfsListPage(page);
  await openAddNfsShareFormFromList(page);

  await fillNfsSharePath(page, path);
  await page.locator(nfsLocators.form.comment).fill(addedShare.description);
  await saveNfsShareForm(page);

  // The list reloads after a save, so the new share is a row on this page.
  await expect(page.locator(nfsLocators.list.row(path, addedShare.description)))
    .toBeVisible({ timeout: formSettleTimeoutMs });

  expect(await findNfsShare(api, path)).toMatchObject({
    path,
    comment: addedShare.description,
    enabled: true,
  });
});
