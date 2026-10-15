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
 *
 * Story: a task the appliance runs takes snapshots named by its naming schema.
 *
 * Neither card nor list has a Run Now for these tasks — the schedule is the only
 * thing that runs one — so that test schedules its task every minute and waits
 * for the first snapshot. A fresh dataset has no snapshots, so every snapshot
 * found on one was taken by its task.
 *
 * Story: switching a task off on the card disables that task and no other. It
 * asserts what the appliance now holds and does not wait to watch the
 * scheduler skip it.
 *
 * Stories: deleting a task that has snapshots asks whether to keep them with
 * their original retention. Kept, each one carries the removal date its task
 * would have given it. Not kept, nothing will remove them. Either way the
 * snapshots stay.
 *
 * Those tests seed the task's snapshot over the API rather than wait for the
 * task to take one. Middleware counts a snapshot as the task's when its name
 * parses with the naming schema at a minute the schedule fires on, which a
 * name can satisfy without the task ever having run.
 */
import {
  countSnapshotTasks,
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  findSnapshotTask,
  findSnapshotTasks,
  type SnapshotTaskSchedule,
} from '../fixtures/snapshot-tasks';
import {
  ensureSnapshotPresent,
  findSnapshotRetention,
  listSnapshots,
  type SnapshotRetention,
} from '../fixtures/snapshots';
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
  toggleSnapshotTaskEnabled,
} from '../flows/snapshot-tasks';
import { openSnapshotList } from '../flows/snapshots';
import { hourlyScheduleLabel } from '../locators/cron';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import { snapshotLocators } from '../locators/snapshots';
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
/** Every minute, so a test can watch a task fire rather than wait on a real schedule. */
const everyMinute: SnapshotTaskSchedule = {
  minute: '*', hour: '*', dom: '*', month: '*', dow: '*',
};

/** What the target's task names a snapshot: {@link targetNamingSchema} with the minute filled in. */
const targetSnapshotName = /^e2e-target-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/;

/**
 * Waiting on a task due every minute: past the next minute boundary, with room
 * for zettarepl to take the snapshot, and polled at a pace that does not hammer
 * the appliance.
 */
const oneTick = { timeout: 150_000, intervals: [5_000] };

/**
 * A snapshot the target's task owns without having run: named by
 * {@link targetNamingSchema}, at midnight on the first of a month, which is when
 * {@link monthly} fires. It is dated years ahead so that the removal date a
 * delete writes is still in the future, and nothing prunes the snapshot while
 * a test reads it.
 */
const ownedSnapshotName = 'e2e-target-2099-01-01_00-00';

/** The seeded task keeps snapshots for two weeks, so this is the day {@link ownedSnapshotName} is due to go. */
const ownedSnapshotDestroyAt = Date.UTC(2099, 0, 15);

/** The name is in the appliance's local time, so the date can be up to a day either side in UTC. */
const oneDayMs = 24 * 60 * 60 * 1000;

/** On the target's dataset, but it matches no naming schema, so no task owns it. */
const manualSnapshotName = 'e2e-manual';

/** Fails unless a retention falls on the day {@link ownedSnapshotDestroyAt} names. */
function expectOwnedSnapshotDate(retention: SnapshotRetention | undefined): void {
  const destroyAt = retention?.destroyAt.getTime() ?? Number.NaN;
  expect(
    Math.abs(destroyAt - ownedSnapshotDestroyAt),
    `due at ${retention?.destroyAt.toISOString() ?? 'no date'}`,
  ).toBeLessThanOrEqual(oneDayMs);
}

/** The names of a dataset's snapshots, sorted so a failure prints them in a stable order. */
async function snapshotNames(api: E2eApiClient, dataset: string): Promise<string[]> {
  const snapshots = await listSnapshots(api, dataset);
  return snapshots.map((snapshot) => snapshot.snapshot_name).sort((a, b) => a.localeCompare(b));
}

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
async function seedTargetAndBystander(
  api: E2eApiClient,
  pool: string,
  schedule: SnapshotTaskSchedule = monthly,
): Promise<void> {
  await ensureSnapshotTaskPresent(api, {
    dataset: `${pool}/${targetLeaf}`, namingSchema: targetNamingSchema, schedule,
  });
  await ensureSnapshotTaskPresent(api, {
    dataset: `${pool}/${bystanderLeaf}`, namingSchema: bystanderNamingSchema, schedule,
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

test('deleting a periodic snapshot task while keeping its snapshots gives them their removal date', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  await ensureSnapshotPresent(api, target, ownedSnapshotName);
  await ensureSnapshotPresent(api, target, manualSnapshotName);

  // The task's own claim, before the delete: this is the date that has to survive it.
  const owned = await findSnapshotRetention(api, target, ownedSnapshotName);
  expect(owned?.source).toBe('periodic_snapshot_task');
  expectOwnedSnapshotDate(owned);

  await deleteSnapshotTask(page, target, true);
  await expect.poll(() => findSnapshotTask(api, target)).toBeUndefined();

  // The same date, now written onto the snapshot, because the task that set it is gone.
  const kept = await findSnapshotRetention(api, target, ownedSnapshotName);
  expect(kept?.source).toBe('property');
  expectOwnedSnapshotDate(kept);

  // Only the task's own snapshots get a date. A manual snapshot beside them does not.
  expect(await findSnapshotRetention(api, target, manualSnapshotName)).toBeUndefined();
  expect(await findSnapshotTask(api, bystander)).toBeDefined();
});

test('deleting a periodic snapshot task without keeping its snapshots leaves them with no removal date', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  await ensureSnapshotPresent(api, target, ownedSnapshotName);

  // Owned before the delete, or "no removal date" afterwards would prove nothing.
  expect((await findSnapshotRetention(api, target, ownedSnapshotName))?.source).toBe('periodic_snapshot_task');

  await deleteSnapshotTask(page, target, false);
  await expect.poll(() => findSnapshotTask(api, target)).toBeUndefined();

  // Still on the appliance, since findSnapshotRetention throws for a missing snapshot, and nothing will remove it now.
  expect(await findSnapshotRetention(api, target, ownedSnapshotName)).toBeUndefined();
  expect(await findSnapshotTask(api, bystander)).toBeDefined();
});

test('a periodic snapshot task takes snapshots named by its naming schema', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  await ensureSnapshotTaskPresent(api, {
    dataset: target, namingSchema: targetNamingSchema, schedule: everyMinute,
  });

  await expect.poll(() => snapshotNames(api, target), oneTick).not.toHaveLength(0);

  // Every one, not just the first: anything else on a dataset made fresh for
  // this test came from somewhere other than this task.
  const names = await snapshotNames(api, target);
  for (const name of names) {
    expect(name).toMatch(targetSnapshotName);
  }

  // And the list the user would look in shows what the appliance took.
  const [first] = names;
  expect(first).toBeDefined();
  await openSnapshotList(page, target);
  await expect(page.locator(snapshotLocators.list.row(target, first ?? ''))).toBeVisible();
});

test('switching a periodic snapshot task off on the card disables that task and no other', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);

  // Enabled first, or reading it disabled afterwards would prove nothing.
  expect((await findSnapshotTask(api, target))?.enabled).toBe(true);

  await toggleSnapshotTaskEnabled(page, target);
  await expect.poll(async () => (await findSnapshotTask(api, target))?.enabled).toBe(false);

  // The switch itself left the bystander alone. Whether the scheduler then skips
  // the disabled task is middleware's behaviour, not this screen's — see
  // "Assert the configuration" in e2e/CLAUDE.md.
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ enabled: true, schedule: monthly });
});
