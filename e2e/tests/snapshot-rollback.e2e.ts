/**
 * Stories: rolling a dataset back to a snapshot, and the check that stops one. Only *contents* show a rollback
 * happened (properties and children survive one), so each test makes a directory over the API after the snapshot
 * and checks for it afterwards. The dialog's strictest setting refuses to roll back past a newer snapshot and
 * offers "No Safety Check"; the last two tests are that pair, since a refusal that never lets go is as wrong as
 * one that never holds.
 */
import {
  directoryExists, ensureDirectoryPresent, ensureSnapshotPresent, ensureSnapshotsAbsent, findSnapshot,
} from '../fixtures/snapshots';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  actionTimeoutMs, closeRollbackDialogAfterSuccess, confirmAndSubmitRollback, openRollbackDialog,
} from '../flows/snapshots';
import { errorDialogLocators } from '../locators/dialogs';
import { snapshotLocators } from '../locators/snapshots';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

const datasetName = 'e2e_snap_rollback';

/** The snapshot rolled back to, and one taken after it for the safety check to find. */
const restorePoint = 'e2e_restore_point';
const newer = 'e2e_newer';

/** Made after {@link restorePoint}, so a rollback to it has something to undo. */
const laterDirectory = 'made_after_snapshot';

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await ensureSnapshotsAbsent(api, dataset);
  await ensureDatasetAbsent(api, dataset);

  // In this order, which is the whole setup: the snapshot is of an empty
  // dataset, and the directory is what has happened to it since.
  await ensureDatasetPresent(api, dataset);
  await ensureSnapshotPresent(api, dataset, restorePoint);
  await ensureDirectoryPresent(api, `${datasetMountPath(dataset)}/${laterDirectory}`);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  if (leavingTestData(`dataset "${dataset}" and its snapshots`)) {
    return;
  }

  await runCleanupSteps([
    ['remove the snapshots', () => ensureSnapshotsAbsent(api, dataset)],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('rolling back to a snapshot undoes what was done to the dataset since', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const directory = `${datasetMountPath(dataset)}/${laterDirectory}`;
  expect(await directoryExists(api, directory)).toBe(true);

  await openRollbackDialog(page, dataset, restorePoint);
  await confirmAndSubmitRollback(page);
  await closeRollbackDialogAfterSuccess(page);

  // The dialog said so; this is whether it is true.
  expect(await directoryExists(api, directory)).toBe(false);
  // Rolling back *to* a snapshot does not consume it.
  expect(await findSnapshot(api, dataset, restorePoint)).toBeDefined();
});

test('a rollback is refused while a newer snapshot would be lost', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const directory = `${datasetMountPath(dataset)}/${laterDirectory}`;
  await ensureSnapshotPresent(api, dataset, newer);

  await openRollbackDialog(page, dataset, restorePoint);
  // Left on the choice it opens with, which is the strictest of the three.
  await confirmAndSubmitRollback(page);

  // Refused in a dialog of its own, over a rollback dialog that stays open for
  // another try.
  await expect(page.locator(errorDialogLocators.title)).toBeVisible({ timeout: actionTimeoutMs });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(snapshotLocators.rollbackDialog.submit)).toBeVisible();

  // And nothing happened — which the error alone does not establish. A
  // rollback that half ran would report a failure just the same.
  expect(await findSnapshot(api, dataset, newer)).toBeDefined();
  expect(await directoryExists(api, directory)).toBe(true);
});

test('with the safety check off, a rollback destroys the newer snapshot', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const directory = `${datasetMountPath(dataset)}/${laterDirectory}`;
  await ensureSnapshotPresent(api, dataset, newer);

  await openRollbackDialog(page, dataset, restorePoint);
  await page.locator(snapshotLocators.rollbackDialog.noSafetyCheck).click();
  await confirmAndSubmitRollback(page);
  await closeRollbackDialogAfterSuccess(page);

  expect(await directoryExists(api, directory)).toBe(false);
  // What the option's caution is about, and what the previous test's refusal
  // was protecting: the newer restore point is gone for good.
  expect(await findSnapshot(api, dataset, newer)).toBeUndefined();
  expect(await findSnapshot(api, dataset, restorePoint)).toBeDefined();
});
