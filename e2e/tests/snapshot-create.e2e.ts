/**
 * Story: an admin takes a snapshot of a dataset by hand.
 *
 * From the dataset's own card, which opens the form with that dataset already
 * chosen and a name already generated — so the shortest path through it is two
 * clicks, and the two things most worth checking are that the snapshot landed
 * on the dataset the card belonged to and that Recursive means what it says.
 * Both are asked of `pool.snapshot.query`, on the parent and on a child.
 */
import { ensureSnapshotsAbsent, findSnapshot } from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openSnapshotList, openTakeSnapshotForm, saveSnapshotForm } from '../flows/snapshots';
import { snapshotLocators } from '../locators/snapshots';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset snapshotted, and a child for Recursive to reach or leave alone. */
const parentName = 'e2e_snap_create';
const childName = 'child';

/** Taken through the form, never over the API — that is the thing under test. */
const snapshotName = 'e2e_by_hand';

test.beforeEach(async ({ api, pool }) => {
  const parent = `${pool}/${parentName}`;

  // Removing the parent takes the child and every snapshot of both with it, so
  // each test starts from a pair of datasets with no snapshots at all.
  await ensureSnapshotsAbsent(api, `${parent}/${childName}`);
  await ensureSnapshotsAbsent(api, parent);
  await ensureDatasetAbsent(api, parent);

  await ensureDatasetPresent(api, parent);
  await ensureDatasetPresent(api, `${parent}/${childName}`);
});

test.afterEach(async ({ api, pool }) => {
  const parent = `${pool}/${parentName}`;

  if (leavingTestData(`dataset "${parent}", its child and their snapshots`)) {
    return;
  }

  await runCleanupSteps([
    ['remove the child\'s snapshots', () => ensureSnapshotsAbsent(api, `${parent}/${childName}`)],
    ['remove the parent\'s snapshots', () => ensureSnapshotsAbsent(api, parent)],
    [`remove dataset ${parentName}`, () => ensureDatasetAbsent(api, parent)],
  ]);
});

test('an admin takes a snapshot of a dataset, and the appliance really has one', async ({ page, api, pool }) => {
  const parent = `${pool}/${parentName}`;

  await openTakeSnapshotForm(page, parent);

  // The form names the snapshot itself. Checked before it is replaced, because
  // a form that opened with an empty name would still pass everything below.
  await expect(page.locator(snapshotLocators.form.name)).toHaveValue(/^manual-/);

  await page.locator(snapshotLocators.form.name).fill(snapshotName);
  await saveSnapshotForm(page);

  expect(await findSnapshot(api, parent, snapshotName)).toMatchObject({
    dataset: parent, snapshot_name: snapshotName,
  });
  // Recursive was left unticked, so the child has nothing. This is the control
  // for the next test: without it "the child got one too" proves nothing.
  expect(await findSnapshot(api, `${parent}/${childName}`, snapshotName)).toBeUndefined();

  // And the admin can find it again, under the dataset it was taken of.
  await openSnapshotList(page, parent);
  await expect(page.locator(snapshotLocators.list.row(parent, snapshotName))).toBeVisible();
});

test('a recursive snapshot takes the child datasets too', async ({ page, api, pool }) => {
  const parent = `${pool}/${parentName}`;

  await openTakeSnapshotForm(page, parent);
  await page.locator(snapshotLocators.form.name).fill(snapshotName);
  await page.locator(snapshotLocators.form.recursive).click();
  await saveSnapshotForm(page);

  expect(await findSnapshot(api, parent, snapshotName)).toBeDefined();
  // One name across the tree, taken at one moment: that is what makes the set
  // usable together, and a child that was missed is found only at restore time.
  expect(await findSnapshot(api, `${parent}/${childName}`, snapshotName)).toBeDefined();
});

test('the form will not take a snapshot with no name', async ({ page, pool }) => {
  const parent = `${pool}/${parentName}`;
  const save = page.locator(snapshotLocators.form.save);
  const name = page.locator(snapshotLocators.form.name);

  await openTakeSnapshotForm(page, parent);

  // Live as it opens, on the generated name — which is what makes the refusal
  // below the name's doing rather than an unfinished form's.
  await expect(save).toBeEnabled();

  // A snapshot needs a name or a naming schema. This appliance offers no
  // schemas (they come from replication tasks, and it has none), so an empty
  // name leaves the form with neither.
  await name.fill('');
  await expect(save).toBeDisabled();

  await name.fill(snapshotName);
  await expect(save).toBeEnabled();
});
