/**
 * Stories: the Add Periodic Snapshot Task form refuses a naming schema with a
 * slash in it, a naming schema without the date tokens, a lifetime of zero, an
 * excluded dataset outside the one being snapshotted, and an exclusion on a task
 * that is not recursive. Each refusal is asserted on the screen and by the task
 * not existing on the appliance.
 *
 * Only the slash is the form's own refusal: `naming_schema` carries a
 * `Validators.pattern`, so Save goes disabled before anything is sent. The rest
 * are middleware's, and come back from `pool.snapshottask.create` as validation
 * errors that `ix-form` pins under the field they name — the naming schema's
 * tokens and the lifetime's `ge=1` from the API model, the two exclusion rules
 * from `plugins/snapshot/crud.py::_validate`. So for those the panel must still
 * be open once the message has arrived, which is what says the save was refused
 * rather than merely slow.
 *
 * A task created by a regression would be on the selected dataset, and
 * `pool.snapshottask.query` is read twice to rule that out: no task on the
 * dataset, and no more tasks on the appliance than before the test.
 */
import { countSnapshotTasks, ensureSnapshotTasksAbsent, findSnapshotTasks } from '../fixtures/snapshot-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  chooseSnapshotTaskDataset,
  openAddSnapshotTaskForm,
  saveSnapshotTaskFormExpectingRefusal,
} from '../flows/snapshot-tasks';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset every test picks in the form. */
const datasetLeaf = 'e2e_snapval_ds';

/** A sibling of {@link datasetLeaf}, so not something a task on it may exclude. */
const otherLeaf = 'e2e_snapval_other';

/** A child of {@link datasetLeaf}: a valid exclusion, but only for a recursive task. */
const childLeaf = `${datasetLeaf}/child`;

/** `Validators.pattern` on `naming_schema`, as `tn-form-field-errors.provider.ts` words it. */
const patternMessage = 'Invalid format or character';

/** zettarepl's `validate_snapshot_naming_schema`, which checks `%Y` first. */
const missingTokensMessage = '%Y must be present in snapshot naming schema';

/** pydantic's wording for the API model's `ge=1` on `lifetime_value`. */
const lifetimeMessage = 'greater than or equal to 1';

/** `plugins/snapshot/crud.py::_validate`, on an excluded path that is not under the dataset. */
const notDescendantMessage = 'Excluded dataset should be a child or other descendant of the selected dataset';

/** The same, on any exclusion for a task that is not recursive. */
const notRecursiveMessage = 'Excluding datasets is not necessary for non-recursive periodic snapshot tasks';

/** Fails unless the refused save left no task on the dataset, and none anywhere else either. */
async function expectNoTaskCreated(api: E2eApiClient, dataset: string, countBefore: number): Promise<void> {
  expect(await findSnapshotTasks(api, dataset)).toHaveLength(0);
  expect(await countSnapshotTasks(api)).toBe(countBefore);
}

/**
 * Tasks first, then their datasets. Run before each test as well as after, so a
 * regression that let a task through, or an interrupted run, does not leave the
 * next test starting from a task it did not expect.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of [datasetLeaf, otherLeaf]) {
    await ensureSnapshotTasksAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
  for (const leaf of [datasetLeaf, otherLeaf, childLeaf]) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = [datasetLeaf, otherLeaf].map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the snapshot tasks on and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the snapshot tasks on "${dataset}"`, () => ensureSnapshotTasksAbsent(api, dataset),
    ]),
    // Recursive, so the child under the first one goes with it.
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

test('the snapshot task form refuses a naming schema with a slash in it', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const countBefore = await countSnapshotTasks(api);
  const { form } = snapshotTaskLocators;

  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // Every other field has a valid default, so Save starts enabled and the
  // refusal below is what disables it.
  await expect(page.locator(form.save)).toBeEnabled();
  await expect(page.locator(form.namingSchemaField)).not.toContainText(patternMessage);

  await page.locator(form.namingSchema).fill('e2e/%Y-%m-%d_%H-%M');
  await page.locator(form.namingSchema).blur();
  await expect(page.locator(form.namingSchemaField)).toContainText(patternMessage);
  await expect(page.locator(form.save)).toBeDisabled();

  await expectNoTaskCreated(api, dataset, countBefore);
});

test('middleware refuses a naming schema without the date tokens', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const countBefore = await countSnapshotTasks(api);
  const { form } = snapshotTaskLocators;

  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // No slash, so the form's own pattern lets it through to middleware.
  await page.locator(form.namingSchema).fill('e2e-no-tokens');
  await saveSnapshotTaskFormExpectingRefusal(page, form.namingSchemaField, missingTokensMessage);

  await expectNoTaskCreated(api, dataset, countBefore);
});

test('middleware refuses a snapshot lifetime of zero', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const countBefore = await countSnapshotTasks(api);
  const { form } = snapshotTaskLocators;

  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // The form only requires a value, so zero reaches middleware.
  await page.locator(form.lifetimeValue).fill('0');
  await saveSnapshotTaskFormExpectingRefusal(page, form.lifetimeValueField, lifetimeMessage);

  await expectNoTaskCreated(api, dataset, countBefore);
});

test('middleware refuses excluding a dataset outside the selected one', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const countBefore = await countSnapshotTasks(api);
  const { form } = snapshotTaskLocators;

  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // Recursive, so the only thing wrong with the exclusion is where it points.
  await page.locator(form.recursive).click();
  await page.locator(form.exclude).fill(`${pool}/${otherLeaf}`);
  await page.locator(form.exclude).press('Enter');
  await saveSnapshotTaskFormExpectingRefusal(page, form.excludeField, notDescendantMessage);

  await expectNoTaskCreated(api, dataset, countBefore);
});

test('middleware refuses an exclusion on a task that is not recursive', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const countBefore = await countSnapshotTasks(api);
  const { form } = snapshotTaskLocators;

  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // A real child, so the only thing wrong is that Recursive is left unticked, as it opens.
  await page.locator(form.exclude).fill(`${pool}/${childLeaf}`);
  await page.locator(form.exclude).press('Enter');
  await saveSnapshotTaskFormExpectingRefusal(page, form.excludeField, notRecursiveMessage);

  await expectNoTaskCreated(api, dataset, countBefore);
});
