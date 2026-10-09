/**
 * Stories: acting on a snapshot from the list acts on the one you picked.
 *
 * A snapshot's actions live in its expanded row, so each belongs to whichever
 * row was opened; every test runs beside a second snapshot of the same dataset
 * that must come through untouched. Hold and clone leave things a later delete
 * trips over — a held snapshot cannot be destroyed, nor one with a clone — so
 * teardown takes the clone first and the fixture releases holds.
 */
import {
  ensureSnapshotPresent, ensureSnapshotsAbsent, findSnapshot, isSnapshotHeld, snapshotId,
} from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { actionTimeoutMs, expandSnapshot, openSnapshotList } from '../flows/snapshots';
import { confirmDestructiveAction } from '../flows/storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const datasetName = 'e2e_snap_list';

/** The snapshot each test acts on, and the one that must survive it. */
const target = 'e2e_target';
const bystander = 'e2e_bystander';

/** Made by the clone test, from the target snapshot. */
const cloneName = 'e2e_snap_list_clone';

async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  // The clone before the snapshot it came from, the snapshots before their dataset.
  await ensureDatasetAbsent(api, `${pool}/${cloneName}`);
  await ensureSnapshotsAbsent(api, `${pool}/${datasetName}`);
  await ensureDatasetAbsent(api, `${pool}/${datasetName}`);
}

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await removeEverything(api, pool);

  // Both over the API: acting on one from the list is the thing under test, so
  // the snapshots themselves are a precondition.
  await ensureDatasetPresent(api, dataset);
  await ensureSnapshotPresent(api, dataset, target);
  await ensureSnapshotPresent(api, dataset, bystander);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`dataset "${pool}/${datasetName}", its snapshots and clone "${pool}/${cloneName}"`)) {
    return;
  }

  await runCleanupSteps([
    [`remove clone ${cloneName}`, () => ensureDatasetAbsent(api, `${pool}/${cloneName}`)],
    ['remove the snapshots', () => ensureSnapshotsAbsent(api, `${pool}/${datasetName}`)],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('deleting a snapshot removes the one that was picked', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await openSnapshotList(page, dataset);
  await expandSnapshot(page, dataset, target);
  await page.locator(snapshotLocators.details.delete(target)).click();

  await confirmDestructiveAction(page);
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

  await expect(page.locator(snapshotLocators.list.row(dataset, target))).toBeHidden();

  expect(await findSnapshot(api, dataset, target)).toBeUndefined();
  // The whole point of the second snapshot. A row-targeting bug does not throw
  // — it quietly destroys a restore point nobody asked about.
  expect(await findSnapshot(api, dataset, bystander)).toBeDefined();
  await expect(page.locator(snapshotLocators.list.row(dataset, bystander))).toBeVisible();
});

test('holding a snapshot reaches the appliance, and so does releasing it', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  expect(await isSnapshotHeld(api, dataset, target)).toBe(false);

  await openSnapshotList(page, dataset);
  await expandSnapshot(page, dataset, target);

  // A tick box with no Save is the easiest control to leave cosmetic: it moves
  // on click whether or not anything was written. A hold is also invisible
  // everywhere else in the UI, so the appliance is the only witness.
  await page.locator(snapshotLocators.details.hold).click();
  await expect.poll(() => isSnapshotHeld(api, dataset, target)).toBe(true);
  expect(await isSnapshotHeld(api, dataset, bystander)).toBe(false);

  await page.locator(snapshotLocators.details.hold).click();
  await expect.poll(() => isSnapshotHeld(api, dataset, target)).toBe(false);
});

test('cloning a snapshot makes a new dataset from it', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const clone = `${pool}/${cloneName}`;
  const dialog = snapshotLocators.cloneDialog;

  await openSnapshotList(page, dataset);
  await expandSnapshot(page, dataset, target);
  // Deletable now, which is what gives the last assertion below its meaning.
  await expect(page.locator(snapshotLocators.details.delete(target))).toBeEnabled();
  await page.locator(snapshotLocators.details.clone(target)).click();

  // The dialog suggests a name of its own; the test's is typed over it so
  // teardown knows what to remove.
  await expect(page.locator(dialog.datasetName)).not.toHaveValue('');
  await page.locator(dialog.datasetName).fill(clone);
  await page.locator(dialog.submit).click();

  await expect(page.locator(dialog.goToDatasets)).toBeVisible({ timeout: actionTimeoutMs });
  await page.locator(dialog.close).click();
  await expect(page.locator(dialog.title)).toBeHidden();

  // A dataset by that name is half of it. Its origin is the other half: that
  // is what says it was cloned from the snapshot that was picked, rather than
  // created empty or cut from the one beside it.
  const created = await findDataset(api, clone);
  expect(created).toBeDefined();
  // `rawvalue`, because `value` is the display form and comes back upper-cased.
  expect((created as { origin?: { rawvalue?: string } } | undefined)?.origin?.rawvalue)
    .toBe(snapshotId(dataset, target));
  // And the snapshot can no longer be deleted from here: a clone depends on it,
  // and ZFS would refuse. The row is collapsed and opened again because its
  // details are read once, when it expands.
  await page.locator(snapshotLocators.list.nameCell(dataset, target)).click();
  await expect(page.locator(snapshotLocators.details.delete(target))).toBeHidden();
  await expandSnapshot(page, dataset, target);
  await expect(page.locator(snapshotLocators.details.delete(target))).toBeDisabled();
});
