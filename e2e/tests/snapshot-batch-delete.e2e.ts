/**
 * Stories: deleting several snapshots at once from the list deletes the ones
 * that were ticked, says which it could not, and Cancel deletes none.
 *
 * Every test ticks two of a dataset's three snapshots, so the third is the
 * witness that the batch went to the rows that were picked and no further.
 *
 * The batch is one `core.bulk` job, which does not fail when one of its calls
 * does: it answers per snapshot, and the dialog reports the failures. A held
 * snapshot is how a test makes one fail — middleware refuses to destroy it
 * without `defer`, which the dialog never sends, and names it in the error.
 *
 * Not covered: the dialog's clone guard, which never fires from the list
 * (see `docs/status.md`), and Go to Storage, which only navigates.
 */
import {
  ensureSnapshotPresent, ensureSnapshotsAbsent, findSnapshot, holdSnapshot, isSnapshotHeld,
} from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  actionTimeoutMs, closeBatchDeleteDialog, confirmAndSubmitBatchDelete, openBatchDeleteDialog, openSnapshotList,
} from '../flows/snapshots';
import { snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const datasetName = 'e2e_snap_batch';

/** The two snapshots each test ticks, and the one it leaves alone. */
const first = 'e2e_batch_a';
const second = 'e2e_batch_b';
const bystander = 'e2e_batch_bystander';

const dialog = snapshotLocators.batchDeleteDialog;

async function removeEverything(api: E2eApiClient, dataset: string): Promise<void> {
  // Releases holds first, which the held-snapshot test leaves behind.
  await ensureSnapshotsAbsent(api, dataset);
  await ensureDatasetAbsent(api, dataset);
}

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await removeEverything(api, dataset);

  // Over the API: deleting them from the list is the thing under test, so the
  // snapshots themselves are a precondition.
  await ensureDatasetPresent(api, dataset);
  await ensureSnapshotPresent(api, dataset, first);
  await ensureSnapshotPresent(api, dataset, second);
  await ensureSnapshotPresent(api, dataset, bystander);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`dataset "${pool}/${datasetName}" and its snapshots`)) {
    return;
  }

  await runCleanupSteps([
    ['remove the snapshots', () => ensureSnapshotsAbsent(api, `${pool}/${datasetName}`)],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('deleting two ticked snapshots deletes both, and leaves the third alone', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await openSnapshotList(page, dataset);
  await openBatchDeleteDialog(page, dataset, [first, second]);

  // The dialog's list is what the job will be pointed at, so it is checked
  // before the click: the ticked two under their dataset, and not the third.
  await expect(page.locator(dialog.dataset(dataset))).toBeVisible();
  await expect(page.locator(dialog.snapshot(first))).toBeVisible();
  await expect(page.locator(dialog.snapshot(second))).toBeVisible();
  await expect(page.locator(dialog.snapshot(bystander))).toBeHidden();

  await confirmAndSubmitBatchDelete(page);

  await expect(page.locator(dialog.success)).toHaveText('Deleted 2 snapshots', { timeout: actionTimeoutMs });
  await expect(page.locator(dialog.errors)).toBeHidden();
  await closeBatchDeleteDialog(page);

  await expect(page.locator(snapshotLocators.list.row(dataset, first))).toBeHidden();
  await expect(page.locator(snapshotLocators.list.row(dataset, second))).toBeHidden();
  await expect(page.locator(snapshotLocators.list.row(dataset, bystander))).toBeVisible();

  expect(await findSnapshot(api, dataset, first)).toBeUndefined();
  expect(await findSnapshot(api, dataset, second)).toBeUndefined();
  expect(await findSnapshot(api, dataset, bystander)).toBeDefined();
});

test('a held snapshot in the batch is reported as not deleted, and the rest are deleted', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  await holdSnapshot(api, dataset, first);
  expect(await isSnapshotHeld(api, dataset, first)).toBe(true);

  await openSnapshotList(page, dataset);
  await openBatchDeleteDialog(page, dataset, [first, second]);
  await confirmAndSubmitBatchDelete(page);

  await expect(page.locator(dialog.warning)).toHaveText(
    'Warning: 1 of 2 snapshots could not be deleted.',
    { timeout: actionTimeoutMs },
  );
  // Middleware's refusal names the snapshot it would not destroy, so the
  // report says which one failed and not merely that one did.
  await expect(page.locator(dialog.errors)).toContainText(first);
  await expect(page.locator(dialog.errors)).not.toContainText(second);
  await closeBatchDeleteDialog(page);

  await expect(page.locator(snapshotLocators.list.row(dataset, second))).toBeHidden();
  await expect(page.locator(snapshotLocators.list.row(dataset, first))).toBeVisible();
  await expect(page.locator(snapshotLocators.list.row(dataset, bystander))).toBeVisible();

  expect(await findSnapshot(api, dataset, second)).toBeUndefined();
  expect(await isSnapshotHeld(api, dataset, first)).toBe(true);
  expect(await findSnapshot(api, dataset, bystander)).toBeDefined();
});

test('cancelling the dialog deletes nothing', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await openSnapshotList(page, dataset);
  await openBatchDeleteDialog(page, dataset, [first, second]);

  await page.locator(dialog.cancel).click();
  await expect(page.locator(dialog.title)).toBeHidden();

  // A backstop: nothing here was submitted, so only a Cancel that deleted on its
  // own could fail it. The appliance is the witness that it did not.
  for (const name of [first, second, bystander]) {
    await expect(page.locator(snapshotLocators.list.row(dataset, name))).toBeVisible();
    expect(await findSnapshot(api, dataset, name)).toBeDefined();
  }
});
