/**
 * Stories: an admin on a dataset opens its snapshots from the dataset's Data
 * Protection card, by "View Snapshots", and sees that dataset's snapshots and its
 * children's, and nobody else's.
 *
 * The link goes to `/datasets/snapshots/<dataset>`, the snapshot list scoped to
 * that dataset: a chip in the page header names it, "Include child datasets"
 * starts on, and the search box starts empty. Removing the chip lists every
 * snapshot again.
 *
 * `…_a` and `…_ab` are siblings whose names share a prefix, which a substring
 * match on the dataset cannot tell apart. The list once fell back to one when
 * the dataset had no snapshots of its own, which the second test covers.
 */
import { ensureSnapshotPresent } from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { clearDatasetScope, openSnapshotList } from '../flows/snapshots';
import { datasetScopeLocators, snapshotLocators } from '../locators/snapshots';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const targetLeaf = 'e2e_dssnaps_a';
const siblingLeaf = 'e2e_dssnaps_ab';
const snapshotName = 'e2e-dssnaps';

/** A list row appearing is a re-filter of rows already loaded, but the first render reads every snapshot. */
const listTimeoutMs = 60_000;

interface Datasets {
  target: string;
  child: string;
  sibling: string;
}

function datasetsIn(pool: string): Datasets {
  const target = `${pool}/${targetLeaf}`;
  return { target, child: `${target}/child`, sibling: `${pool}/${siblingLeaf}` };
}

/** Deleting the target is recursive, so it takes the child and every snapshot with it. */
test.beforeEach(async ({ api, pool }) => {
  const { target, child, sibling } = datasetsIn(pool);
  await ensureDatasetAbsent(api, target);
  await ensureDatasetAbsent(api, sibling);
  await ensureDatasetPresent(api, target);
  await ensureDatasetPresent(api, child);
  await ensureDatasetPresent(api, sibling);
});

test.afterEach(async ({ api, pool }) => {
  const { target, sibling } = datasetsIn(pool);
  if (leavingTestData(`the datasets ${target} and ${sibling}, and their snapshots`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the dataset "${target}"`, () => ensureDatasetAbsent(api, target)],
    [`remove the dataset "${sibling}"`, () => ensureDatasetAbsent(api, sibling)],
  ]);
});

test('View Snapshots lists the dataset\'s snapshots and its children\'s, not a sibling\'s', async ({
  page, api, pool,
}) => {
  const { target, child, sibling } = datasetsIn(pool);
  for (const dataset of [target, child, sibling]) {
    await ensureSnapshotPresent(api, dataset, snapshotName);
  }
  const { list } = snapshotLocators;

  await openSnapshotList(page, target);

  await expect(page.locator(datasetScopeLocators.chip)).toContainText(target);
  await expect(page.locator(list.search)).toHaveValue('');
  await expect(page.locator(list.row(target, snapshotName))).toBeVisible({ timeout: listTimeoutMs });
  await expect(page.locator(list.row(child, snapshotName))).toBeVisible();
  await expect(page.locator(list.row(sibling, snapshotName))).toBeHidden();

  // Without children, the dataset's own snapshot alone.
  await page.locator(datasetScopeLocators.includeChildDatasets).click();
  await expect(page.locator(list.row(child, snapshotName))).toBeHidden();
  await expect(page.locator(list.row(target, snapshotName))).toBeVisible();
  await expect(page.locator(list.row(sibling, snapshotName))).toBeHidden();

  // Without the scope, everything, the sibling included.
  await clearDatasetScope(page);
  await expect(page.locator(list.row(sibling, snapshotName))).toBeVisible();
  await expect(page.locator(list.row(child, snapshotName))).toBeVisible();
  await expect(page.locator(list.row(target, snapshotName))).toBeVisible();
});

test('View Snapshots on a dataset with no snapshots of its own lists its children\'s, not a sibling\'s', async ({
  page, api, pool,
}) => {
  const { target, child, sibling } = datasetsIn(pool);
  await ensureSnapshotPresent(api, child, snapshotName);
  await ensureSnapshotPresent(api, sibling, snapshotName);
  const { list } = snapshotLocators;

  await openSnapshotList(page, target);

  await expect(page.locator(datasetScopeLocators.chip)).toContainText(target);
  await expect(page.locator(list.row(child, snapshotName))).toBeVisible({ timeout: listTimeoutMs });
  await expect(page.locator(list.row(sibling, snapshotName))).toBeHidden();

  // The dataset itself has none, so without children nothing is listed.
  await page.locator(datasetScopeLocators.includeChildDatasets).click();
  await expect(page.locator(list.row(child, snapshotName))).toBeHidden();
  await expect(page.locator(list.row(sibling, snapshotName))).toBeHidden();
});
