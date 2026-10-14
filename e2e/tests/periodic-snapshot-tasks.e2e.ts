/**
 * Stories: an admin adds, edits and deletes a periodic snapshot task from the
 * card on Data Protection, and the appliance holds what they did.
 *
 * Each action is asserted twice, the way the other card specs do it: the card's
 * row says the screen believed it, and `pool.snapshottask.query` says the
 * appliance did it — and carries what the card does not show at all, the
 * retention, the naming schema and the schedule.
 *
 * Edit and delete each act beside a second task that must come through
 * untouched. The row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug would act on the
 * wrong task without failing anything else.
 *
 * Every task snapshots a dataset of its own, made fresh for each test. A task
 * that fires on its schedule leaves snapshots behind, and those go with the
 * dataset — and a dataset with snapshots would put a second box in the delete
 * dialog, which the delete test does not expect.
 */
import {
  countSnapshotTasks,
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  findSnapshotTask,
  findSnapshotTasks,
  type SnapshotTaskSchedule,
} from '../fixtures/snapshot-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  chooseSnapshotTaskDataset,
  chooseSnapshotTaskLifetimeUnit,
  chooseSnapshotTaskSchedule,
  deleteSnapshotTask,
  openAddSnapshotTaskForm,
  openEditSnapshotTaskForm,
  saveSnapshotTaskForm,
  snapshotTaskCardPageSize,
} from '../flows/snapshot-tasks';
import { hourlyScheduleLabel } from '../locators/cron';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Snapshotted by a task created through the form, never over the API — that is the thing under test. */
const createdLeaf = 'e2e_snaptask_created';

/** Snapshotted by a task provisioned over the API, so there is something to edit or delete. */
const targetLeaf = 'e2e_snaptask_target';
const targetNamingSchema = 'e2e-target-%Y-%m-%d_%H-%M';

/** What the edit test changes the target's naming schema to. */
const editedNamingSchema = 'e2e-edited-%Y%m%d-%H%M';

/** Snapshotted by the task that must survive whatever is done to the target. */
const bystanderLeaf = 'e2e_snaptask_bystander';
const bystanderNamingSchema = 'e2e-bystander-%Y-%m-%d_%H-%M';

const allLeaves = [createdLeaf, targetLeaf, bystanderLeaf];

/** The form's default, "Daily": midnight every day. */
const daily: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '*', month: '*', dow: '*',
};
/** The first of every month, which no preset the edit picks can be confused with. */
const monthly: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
/** Hourly, and the whole-day window the form offers alongside it and leaves as it is. */
const hourly = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*', begin: '00:00', end: '23:59',
};

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four tasks before its pager, and the pager leaves for the full
 * list rather than expanding — see `snapshotTaskCardPageSize`. A fresh appliance
 * holds none; failing here says why rather than timing out on a hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countSnapshotTasks(api);
  expect(
    existing + adding <= snapshotTaskCardPageSize,
    `the card lists ${snapshotTaskCardPageSize} tasks, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/** Both tasks over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<void> {
  await ensureSnapshotTaskPresent(api, {
    dataset: `${pool}/${targetLeaf}`, namingSchema: targetNamingSchema, schedule: monthly,
  });
  await ensureSnapshotTaskPresent(api, {
    dataset: `${pool}/${bystanderLeaf}`, namingSchema: bystanderNamingSchema, schedule: monthly,
  });
}

/**
 * Tasks first, then their datasets, so nothing is left pointing at a dataset
 * that is gone. Run before each test as well as after, so an interrupted run
 * leaves the next one able to start — and the datasets are then made again, so
 * none carries a snapshot an earlier run's task took.
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

test('an admin adds a periodic snapshot task, and the appliance really has one', async ({ page, api, pool }) => {
  const dataset = `${pool}/${createdLeaf}`;
  await requireRoomOnCard(api, 1);

  const { form, card } = snapshotTaskLocators;
  await openAddSnapshotTaskForm(page);
  await chooseSnapshotTaskDataset(page, dataset);
  // Unticked by default, so a stored `recursive: true` can only have come from this click.
  await page.locator(form.recursive).click();
  await page.locator(form.lifetimeValue).fill('3');
  await chooseSnapshotTaskLifetimeUnit(page, 'DAY');
  await saveSnapshotTaskForm(page);

  await expect(page.locator(card.dataset(dataset))).toHaveText(dataset);

  expect(await findSnapshotTasks(api, dataset)).toHaveLength(1);
  expect(await findSnapshotTask(api, dataset)).toMatchObject({
    dataset,
    recursive: true,
    lifetime_value: 3,
    lifetime_unit: 'DAY',
    // Untouched in the form, so they have to come back out as its defaults.
    naming_schema: 'auto-%Y-%m-%d_%H-%M',
    schedule: daily,
    exclude: [],
    allow_empty: true,
    enabled: true,
  });
});

test('editing a periodic snapshot task from the card changes the task that was picked', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  const before = await findSnapshotTask(api, target);

  const { form, card } = snapshotTaskLocators;
  await openEditSnapshotTaskForm(page, target, targetNamingSchema);
  await page.locator(form.lifetimeValue).fill('5');
  await chooseSnapshotTaskLifetimeUnit(page, 'MONTH');
  await page.locator(form.namingSchema).fill(editedNamingSchema);
  await chooseSnapshotTaskSchedule(page, hourlyScheduleLabel);
  // Hourly is the one preset that asks for a window. Its appearing is how we
  // know the preset took, since the window is stored only in that mode.
  await expect(page.locator(form.begin)).toBeVisible();
  await page.locator(form.enabled).click();
  await saveSnapshotTaskForm(page);

  await expect(page.locator(card.dataset(target))).toHaveText(target);

  // The same record, by id, and still the only one on the dataset: an update,
  // not a delete and a create that happen to leave the card looking the same.
  expect(await findSnapshotTasks(api, target)).toHaveLength(1);
  expect(await findSnapshotTask(api, target)).toMatchObject({
    id: before?.id,
    lifetime_value: 5,
    lifetime_unit: 'MONTH',
    naming_schema: editedNamingSchema,
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
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

test('deleting a periodic snapshot task from the card removes the task that was picked', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);

  await deleteSnapshotTask(page, target);

  // Polled rather than read once: the card reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findSnapshotTask(api, target)).toBeUndefined();

  // The whole point of the second task: the card looks right either way.
  await expect(page.locator(snapshotTaskLocators.card.row(bystander))).toBeVisible();
  expect(await findSnapshotTask(api, bystander)).toBeDefined();
});
