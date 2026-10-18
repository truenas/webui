/**
 * Stories: promoting a clone from the Datasets page swaps it with the dataset it came from.
 *
 * Promote reverses the dependency: the snapshot moves to the clone, and the
 * original becomes the dataset with an origin. That decides which of the two can
 * be deleted afterwards, so teardown cannot assume an order — it removes
 * whichever dataset currently has an origin first, which is right on both sides
 * of the promote.
 */
import { cloneSnapshot, ensureSnapshotPresent, findSnapshot, snapshotId } from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { selectDataset } from '../flows/encryption';
import { actionTimeoutMs } from '../flows/snapshots';
import { datasetActionsLocators } from '../locators/dataset-actions';
import { datasetDetailsLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const sourceName = 'e2e_promote_src';
const cloneName = 'e2e_promote_clone';
const snapshotName = 'base';

/**
 * A dataset's origin, the snapshot it was cloned from. Empty for a dataset that
 * is not a clone, and undefined for one the appliance does not have.
 */
async function originOf(api: E2eApiClient, name: string): Promise<string | undefined> {
  // `rawvalue`, because `value` is the display form and comes back upper-cased.
  const dataset = await findDataset(api, name) as { origin?: { rawvalue?: string } } | undefined;

  return dataset?.origin?.rawvalue;
}

/** Deletes `name` only while it is the dependent one of the pair. */
async function removeIfClone(api: E2eApiClient, name: string): Promise<void> {
  if (await originOf(api, name)) {
    await ensureDatasetAbsent(api, name);
  }
}

async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  const source = `${pool}/${sourceName}`;
  const clone = `${pool}/${cloneName}`;

  // Whichever has an origin first; the snapshot goes with the dataset holding it.
  await removeIfClone(api, source);
  await removeIfClone(api, clone);
  await ensureDatasetAbsent(api, source);
  await ensureDatasetAbsent(api, clone);
}

test.beforeEach(async ({ api, pool }) => {
  const source = `${pool}/${sourceName}`;

  await removeEverything(api, pool);

  // All over the API: promoting is the thing under test, so the clone is a precondition.
  await ensureDatasetPresent(api, source);
  await ensureSnapshotPresent(api, source, snapshotName);
  await cloneSnapshot(api, source, snapshotName, `${pool}/${cloneName}`);
});

test.afterEach(async ({ api, pool }) => {
  const source = `${pool}/${sourceName}`;
  const clone = `${pool}/${cloneName}`;

  if (leavingTestData(`datasets "${source}" and "${clone}", and snapshot "@${snapshotName}"`)) {
    return;
  }

  await runCleanupSteps([
    [`remove ${sourceName} if it is the clone`, () => removeIfClone(api, source)],
    [`remove ${cloneName} if it is the clone`, () => removeIfClone(api, clone)],
    [`remove dataset ${sourceName}`, () => ensureDatasetAbsent(api, source)],
    [`remove dataset ${cloneName}`, () => ensureDatasetAbsent(api, clone)],
  ]);
});

test('promoting a clone makes its origin the clone of it', async ({ page, api, pool }) => {
  const source = `${pool}/${sourceName}`;
  const clone = `${pool}/${cloneName}`;

  // The starting arrangement, so that each assertion after the promote is a change.
  expect(await originOf(api, clone)).toBe(snapshotId(source, snapshotName));
  expect(await originOf(api, source)).toBe('');

  await selectDataset(page, clone);
  await page.locator(datasetActionsLocators.menu).click();
  await page.locator(datasetActionsLocators.promote).click();

  // Promote asks nothing and reports only in a toast, which carries no
  // `data-test`, so the appliance is what says it landed.
  await expect.poll(() => originOf(api, clone), { timeout: actionTimeoutMs }).toBe('');
  expect(await originOf(api, source)).toBe(snapshotId(clone, snapshotName));

  // The snapshot moved with the dependency: it now belongs to the clone.
  expect(await findSnapshot(api, clone, snapshotName)).toBeDefined();
  expect(await findSnapshot(api, source, snapshotName)).toBeUndefined();

  // With no origin left the clone has nothing to promote, and Promote is the
  // menu's only item, so the card drops the menu's trigger altogether.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(clone);
  await expect(page.locator(datasetActionsLocators.menu)).toBeHidden({ timeout: actionTimeoutMs });

  // And the original, a clone now, is offered it.
  await selectDataset(page, source);
  await page.locator(datasetActionsLocators.menu).click();
  await expect(page.locator(datasetActionsLocators.promote)).toBeVisible();
});
