/**
 * Stories: editing a periodic snapshot task in a way that would move the
 * removal date of snapshots it already took warns how many, and offers to keep
 * their current date. Kept, the old date is written onto each snapshot. Not
 * kept, the task's new lifetime decides. An edit that touches nothing about
 * retention warns of nothing.
 *
 * The task's snapshot is seeded over the API rather than taken by the task, the
 * way `periodic-snapshot-tasks.e2e.ts` seeds one for the delete dialog: a name
 * the naming schema parses, at a minute the schedule fires on, is the task's
 * without the task ever having run. See `ownedSnapshotName`.
 *
 * Every retention is asserted through `pool.snapshot.query`, not only through
 * what the warning said.
 *
 * Story: switching a disabled task back on from the card enables it.
 *
 * Story: the full list's Snapshots button leads to the snapshot list, where
 * the task's snapshot is.
 */
import {
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  expectOwnedSnapshotDate,
  findSnapshotTask,
  monthlySchedule,
  ownedNamingSchema,
  ownedSnapshotName,
} from '../fixtures/snapshot-tasks';
import { ensureSnapshotPresent, findSnapshotRetention } from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  openEditSnapshotTaskForm,
  openSnapshotTaskList,
  requireRoomOnSnapshotTaskCard,
  saveSnapshotTaskForm,
  toggleSnapshotTaskEnabled,
} from '../flows/snapshot-tasks';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import { snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const targetLeaf = 'e2e_snapret_target';

/** What the edit form asks middleware each time a field that bears on retention settles. */
const retentionCheckMethod = 'pool.snapshottask.update_will_change_retention_for';

/** Two weeks shortened to one: the day {@link ownedSnapshotName} is due to go once the edit lands. */
const shortenedDestroyAt = Date.UTC(2099, 0, 8);

/** How long the retention check may take to answer, after the form's 250 ms debounce. */
const retentionCheckTimeoutMs = 30_000;

test.use({ recordApiCalls: true });

/** The task, monthly and two weeks, and the one snapshot it owns. */
async function seedTaskWithSnapshot(api: E2eApiClient, dataset: string): Promise<void> {
  await ensureSnapshotTaskPresent(api, { dataset, namingSchema: ownedNamingSchema, schedule: monthlySchedule });
  await ensureSnapshotPresent(api, dataset, ownedSnapshotName);
}

/** The task's own claim before the edit, or a changed date afterwards would prove nothing. */
async function expectOwnedByTask(api: E2eApiClient, dataset: string): Promise<void> {
  const owned = await findSnapshotRetention(api, dataset, ownedSnapshotName);
  expect(owned?.source).toBe('periodic_snapshot_task');
  expectOwnedSnapshotDate(owned);
}

/**
 * The task first, then its dataset, which takes the seeded snapshot with it —
 * including one whose removal date became a property. Run before each test as
 * well as after, so an interrupted run leaves the next one able to start.
 */
test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${targetLeaf}`;
  await ensureSnapshotTasksAbsent(api, dataset);
  await ensureDatasetAbsent(api, dataset);
  await ensureDatasetPresent(api, dataset);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${targetLeaf}`;
  if (leavingTestData(`the snapshot task on and the dataset ${dataset}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the snapshot tasks on "${dataset}"`, () => ensureSnapshotTasksAbsent(api, dataset)],
    [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('shortening the lifetime with Preserve Snapshot Retention keeps the old removal date on its snapshot', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  await requireRoomOnSnapshotTaskCard(api, 1);
  await seedTaskWithSnapshot(api, target);
  await expectOwnedByTask(api, target);

  const { form } = snapshotTaskLocators;
  await openEditSnapshotTaskForm(page, target, ownedNamingSchema);
  await page.locator(form.lifetimeValue).fill('1');
  await expect(page.locator(form.affectedSnapshots)).toHaveText('1', { timeout: retentionCheckTimeoutMs });
  await page.locator(form.fixateRemovalDate).click();
  await saveSnapshotTaskForm(page);

  expect((await findSnapshotTask(api, target))?.lifetime_value).toBe(1);

  // The same date as before the edit, now written onto the snapshot itself.
  const fixed = await findSnapshotRetention(api, target, ownedSnapshotName);
  expect(fixed?.source).toBe('property');
  expectOwnedSnapshotDate(fixed);
});

test('shortening the lifetime without fixating moves the removal date of the task snapshots', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  await requireRoomOnSnapshotTaskCard(api, 1);
  await seedTaskWithSnapshot(api, target);
  await expectOwnedByTask(api, target);

  const { form } = snapshotTaskLocators;
  await openEditSnapshotTaskForm(page, target, ownedNamingSchema);
  await page.locator(form.lifetimeValue).fill('1');
  await expect(page.locator(form.affectedSnapshots)).toHaveText('1', { timeout: retentionCheckTimeoutMs });
  // Unticked by default, and left so.
  await expect(page.locator(form.fixateRemovalDate)).not.toBeChecked();
  await saveSnapshotTaskForm(page);

  expect((await findSnapshotTask(api, target))?.lifetime_value).toBe(1);

  // Still the task's to decide, and the task now keeps it for one week.
  const moved = await findSnapshotRetention(api, target, ownedSnapshotName);
  expect(moved?.source).toBe('periodic_snapshot_task');
  expectOwnedSnapshotDate(moved, shortenedDestroyAt);
});

test('an edit that touches nothing about retention shows no retention warning', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  await requireRoomOnSnapshotTaskCard(api, 1);
  await seedTaskWithSnapshot(api, target);
  await expectOwnedByTask(api, target);

  const { form } = snapshotTaskLocators;
  await openEditSnapshotTaskForm(page, target, ownedNamingSchema);
  const checkAnswers = (from: number): (string | undefined)[] => (
    apiCallsTo(page, retentionCheckMethod).slice(from).map((call) => call.answer)
  );
  // The form checks once on opening, with the task as loaded.
  await expect.poll(() => checkAnswers(0), { timeout: retentionCheckTimeoutMs }).toContain('result');
  const before = apiCallsTo(page, retentionCheckMethod).length;

  // Allow Empty is not a field the form re-checks on. The lifetime is, so it is
  // typed again as it was: that sends a fresh check, with nothing changed that
  // bears on retention, and the warning has to stay away once it has answered.
  await page.locator(form.allowEmpty).click();
  await expect(page.locator(form.allowEmpty)).not.toBeChecked();
  await page.locator(form.lifetimeValue).fill('2');
  await expect.poll(() => checkAnswers(before), { timeout: retentionCheckTimeoutMs }).toContain('result');

  await expect(page.locator(form.affectedSnapshots)).toHaveCount(0);
  await expect(page.locator(form.fixateRemovalDate)).toHaveCount(0);
});

test('switching a disabled periodic snapshot task on from the card enables it', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  await requireRoomOnSnapshotTaskCard(api, 1);
  await ensureSnapshotTaskPresent(api, {
    dataset: target, namingSchema: ownedNamingSchema, schedule: monthlySchedule, enabled: false,
  });

  // Disabled first, or reading it enabled afterwards would prove nothing.
  expect((await findSnapshotTask(api, target))?.enabled).toBe(false);

  await toggleSnapshotTaskEnabled(page, target);
  await expect.poll(async () => (await findSnapshotTask(api, target))?.enabled).toBe(true);
});

test('the Snapshots button on the periodic snapshot task list opens the snapshot list', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${targetLeaf}`;
  await seedTaskWithSnapshot(api, target);

  await openSnapshotTaskList(page);
  await page.locator(snapshotTaskLocators.list.snapshots).click();

  await expect(page).toHaveURL(/\/datasets\/snapshots\/?$/);
  await expect(page.locator(snapshotLocators.list.add)).toBeVisible();

  // The appliance may hold more snapshots than one page shows.
  await page.locator(snapshotLocators.list.search).fill(ownedSnapshotName);
  await expect(page.locator(snapshotLocators.list.row(target, ownedSnapshotName))).toBeVisible();
});
