/**
 * Stories: from the full Periodic Snapshot Tasks list, an admin searches, edits and deletes a task. The list has
 * its own search, detail-panel actions and ids (`snapshotTaskLocators.list`), so the card spec says nothing about
 * it. Each action runs beside a second task that must stay untouched, to catch row-targeting bugs. There's no Run
 * or Enabled switch, so the edit test switches a task off in the form, and leaves the naming schema alone because
 * the list names a row by it. Tasks are monthly on fresh datasets of their own, so none fires during the spec.
 */
import {
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  findSnapshotTask,
  findSnapshotTasks,
  type SnapshotTaskSchedule,
} from '../fixtures/snapshot-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { searchTaskList } from '../flows/data-protection';
import {
  chooseSnapshotTaskLifetimeUnit,
  chooseSnapshotTaskSchedule,
  deleteSnapshotTaskFromList,
  openEditSnapshotTaskFormFromList,
  openSnapshotTaskList,
  saveSnapshotTaskForm,
} from '../flows/snapshot-tasks';
import { hourlyScheduleLabel } from '../locators/cron';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Snapshotted by the task an action is aimed at. */
const targetLeaf = 'e2e_snaplist_target';
const targetNamingSchema = 'e2e-snaplist-target-%Y-%m-%d_%H-%M';

/** Snapshotted by the task that must survive whatever is done to the target. */
const bystanderLeaf = 'e2e_snaplist_bystander';
const bystanderNamingSchema = 'e2e-snaplist-bystander-%Y-%m-%d_%H-%M';

const allLeaves = [targetLeaf, bystanderLeaf];

/** The first of every month, which no preset the edit picks can be confused with. */
const monthly: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
/** Hourly, and the whole-day window the form offers alongside it and leaves as it is. */
const hourly = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*', begin: '00:00', end: '23:59',
};

/** Both tasks over the API: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<{ target: string; bystander: string }> {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await ensureSnapshotTaskPresent(api, { dataset: target, namingSchema: targetNamingSchema, schedule: monthly });
  await ensureSnapshotTaskPresent(api, { dataset: bystander, namingSchema: bystanderNamingSchema, schedule: monthly });
  return { target, bystander };
}

/**
 * Tasks first, then their datasets, so nothing is left pointing at a dataset
 * that is gone. Run before each test as well as after, so an interrupted run
 * leaves the next one able to start.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureSnapshotTasksAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the snapshot tasks on and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the snapshot tasks on "${dataset}"`, () => ensureSnapshotTasksAbsent(api, dataset),
    ]),
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

test('searching the full Periodic Snapshot Tasks list narrows it to the task that matches', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const { list } = snapshotTaskLocators;

  await openSnapshotTaskList(page);
  // Both are listed before the search, so the bystander going is the search's doing.
  await expect(page.locator(list.row(target, targetNamingSchema))).toBeVisible();
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeVisible();

  // By dataset, one of the two columns the list searches. No other task's dataset or schema holds it.
  await searchTaskList(page, target);

  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);
  await expect(page.locator(list.anyRow)).toHaveCount(1);
});

test('editing a periodic snapshot task from the full list changes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const before = await findSnapshotTask(api, target);

  const { form, list } = snapshotTaskLocators;
  await openSnapshotTaskList(page);
  await openEditSnapshotTaskFormFromList(page, target, targetNamingSchema);
  await page.locator(form.lifetimeValue).fill('5');
  await chooseSnapshotTaskLifetimeUnit(page, 'MONTH');
  await chooseSnapshotTaskSchedule(page, hourlyScheduleLabel);
  // Hourly is the one preset that asks for a window. Its appearing is how we
  // know the preset took, since the window is stored only in that mode.
  await expect(page.locator(form.begin)).toBeVisible();
  // Seeded enabled, and the list has no switch: this is how the list turns a task off.
  await page.locator(form.enabled).click();
  await saveSnapshotTaskForm(page);

  // Neither the dataset nor the naming schema changed, so the row keeps its ids.
  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);

  // The same record, by id, and still the only one on the dataset: an update,
  // not a delete and a create that happen to leave the list looking the same.
  expect(await findSnapshotTasks(api, target)).toHaveLength(1);
  expect(await findSnapshotTask(api, target)).toMatchObject({
    id: before?.id,
    lifetime_value: 5,
    lifetime_unit: 'MONTH',
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    naming_schema: targetNamingSchema,
    recursive: false,
    allow_empty: true,
  });

  expect(await findSnapshotTask(api, bystander)).toMatchObject({
    naming_schema: bystanderNamingSchema,
    lifetime_value: 2,
    lifetime_unit: 'WEEK',
    schedule: monthly,
    enabled: true,
  });
});

test('deleting a periodic snapshot task from the full list removes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);

  await openSnapshotTaskList(page);
  await deleteSnapshotTaskFromList(page, target, targetNamingSchema);

  // Polled rather than read once: the list reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findSnapshotTask(api, target)).toBeUndefined();

  // The whole point of the second task: the list looks right either way.
  await expect(page.locator(snapshotTaskLocators.list.row(bystander, bystanderNamingSchema))).toBeVisible();
  expect(await findSnapshotTask(api, bystander)).toBeDefined();
});
