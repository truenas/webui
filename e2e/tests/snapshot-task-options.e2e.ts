/**
 * Stories: an admin adds a recursive periodic snapshot task that excludes one
 * child and takes no empty snapshots, adds one on a custom schedule built in
 * the scheduler dialog, and adds a second task to a dataset that already has
 * one. The appliance holds what they set.
 *
 * The card spec, `periodic-snapshot-tasks.e2e.ts`, leaves every one of these at
 * the form's default. The custom schedule is also the first coverage of the
 * scheduler dialog, which every task form with a schedule shares.
 *
 * Two tasks on one dataset share every id on the card, whose row tag is the
 * dataset alone, so that test works from the full list, whose row tag adds the
 * naming schema.
 *
 * What a task then does on its schedule is middleware's behaviour, not this
 * form's — see "Assert the configuration" in e2e/CLAUDE.md. The seeded task is
 * monthly, so nothing fires while the spec runs.
 */
import {
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  findSnapshotTask,
  findSnapshotTasks,
  monthlySchedule as monthly,
} from '../fixtures/snapshot-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { chooseCustomSchedule } from '../flows/scheduler';
import {
  chooseSnapshotTaskDataset,
  deleteSnapshotTaskFromList,
  openAddSnapshotTaskForm,
  openSnapshotTaskList,
  requireRoomOnSnapshotTaskCard,
  saveSnapshotTaskForm,
} from '../flows/snapshot-tasks';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ laneSpec: 'snapshot-task-options' });

/** Snapshotted recursively, with {@link skipChild} excluded and {@link keepChild} left in. */
const parentLeaf = 'e2e_snapx_parent';
const keepChild = `${parentLeaf}/keep`;
const skipChild = `${parentLeaf}/skip`;

/** Snapshotted on the schedule built in the dialog. */
const customLeaf = 'e2e_snapx_custom';

/** Snapshotted by two tasks at once, told apart by their naming schemas. */
const multiLeaf = 'e2e_snapx_multi';
const firstNamingSchema = 'e2e-first-%Y-%m-%d_%H-%M';
const secondNamingSchema = 'e2e-second-%Y%m%d-%H%M';

/** The datasets made at the top of the pool. Removing one removes its children with it. */
const topLeaves = [parentLeaf, customLeaf, multiLeaf];

/** The naming schemas of every task on a dataset, sorted so a failure prints them in a stable order. */
async function namingSchemas(api: E2eApiClient, dataset: string): Promise<string[]> {
  const tasks = await findSnapshotTasks(api, dataset);
  return tasks.map((task) => task.naming_schema ?? '').sort((a, b) => a.localeCompare(b));
}

/**
 * Tasks first, then their datasets, so nothing is left pointing at a dataset
 * that is gone. Run before each test as well as after, so an interrupted run
 * leaves the next one able to start.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of topLeaves) {
    await ensureSnapshotTasksAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
  for (const leaf of [...topLeaves, keepChild, skipChild]) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = topLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the snapshot tasks on and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the snapshot tasks on "${dataset}"`, () => ensureSnapshotTasksAbsent(api, dataset),
    ]),
    // Recursive, so the two children under the parent go with it.
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

test('a recursive periodic snapshot task excludes the child it names and takes no empty snapshots', async ({
  page, api, pool,
}) => {
  const dataset = `${pool}/${parentLeaf}`;
  const excluded = `${pool}/${skipChild}`;
  await requireRoomOnSnapshotTaskCard(api, 1);

  const { form, card } = snapshotTaskLocators;
  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // Unticked by default, so a stored `recursive: true` can only have come from this click.
  await page.locator(form.recursive).click();
  await page.locator(form.exclude).fill(excluded);
  await page.locator(form.exclude).press('Enter');
  // Ticked by default, so a stored `allow_empty: false` can only have come from this click.
  await page.locator(form.allowEmpty).click();
  await saveSnapshotTaskForm(page);

  await expect(page.locator(card.dataset(dataset))).toHaveText(dataset);

  expect(await findSnapshotTasks(api, dataset)).toHaveLength(1);
  expect(await findSnapshotTask(api, dataset)).toMatchObject({
    dataset,
    recursive: true,
    // Only the child that was named: the other child stays in the task.
    exclude: [excluded],
    allow_empty: false,
  });
});

test('a periodic snapshot task saves the custom schedule built in the scheduler dialog', async ({
  page, api, pool,
}) => {
  const dataset = `${pool}/${customLeaf}`;
  await requireRoomOnSnapshotTaskCard(api, 1);

  const { form, card } = snapshotTaskLocators;
  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  await chooseCustomSchedule(page, 'schedule', {
    minutes: '15',
    hours: '3',
    days: '*',
    untickWeekdays: ['Sun'],
  });
  // The select now shows the dialog's crontab as its own "Custom …" option. A
  // cancelled dialog would have put back the Daily default instead, and one
  // whose result was dropped would leave the action option showing.
  await expect(page.locator(form.schedule)).toContainText('Custom ');
  await expect(page.locator(form.schedule)).not.toContainText('Create Custom schedule');
  await saveSnapshotTaskForm(page);

  await expect(page.locator(card.dataset(dataset))).toHaveText(dataset);

  expect(await findSnapshotTask(api, dataset)).toMatchObject({
    schedule: {
      minute: '15',
      hour: '3',
      dom: '*',
      // Every month stays ticked, which the dialog writes as `*`. The weekdays
      // are written by name, Monday first, and middleware keeps them as sent.
      month: '*',
      dow: 'mon,tue,wed,thu,fri,sat',
    },
  });
});

test('a second periodic snapshot task on the same dataset gets its own row on the full list', async ({
  page, api, pool,
}) => {
  const dataset = `${pool}/${multiLeaf}`;
  await ensureSnapshotTaskPresent(api, { dataset, namingSchema: firstNamingSchema, schedule: monthly });
  const first = await findSnapshotTask(api, dataset);
  expect(first).toBeDefined();

  const { form, list } = snapshotTaskLocators;
  await openSnapshotTaskList(page);
  await page.locator(list.add).click();
  await expect(page.locator(form.namingSchema)).toBeVisible();
  await chooseSnapshotTaskDataset(page, dataset);
  await page.locator(form.namingSchema).fill(secondNamingSchema);
  await saveSnapshotTaskForm(page);

  await expect(page.locator(list.row(dataset, firstNamingSchema))).toBeVisible();
  await expect(page.locator(list.row(dataset, secondNamingSchema))).toBeVisible();
  expect(await namingSchemas(api, dataset)).toEqual([firstNamingSchema, secondNamingSchema]);

  await deleteSnapshotTaskFromList(page, dataset, secondNamingSchema);

  // Polled rather than read once: the list reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => namingSchemas(api, dataset)).toEqual([firstNamingSchema]);
  // The same record that was seeded, not one that replaced it.
  expect((await findSnapshotTask(api, dataset))?.id).toBe(first?.id);
  await expect(page.locator(list.row(dataset, firstNamingSchema))).toBeVisible();
});
