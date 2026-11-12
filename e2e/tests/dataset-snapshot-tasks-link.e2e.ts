/**
 * Stories: an admin on a dataset opens its periodic snapshot tasks from the
 * dataset's Data Protection card, by "View Snapshot Tasks", and edits and
 * deletes a task from the list that link opens. The appliance holds what they did.
 *
 * The link goes to `/data-protection/snapshot/<dataset>`, the full Periodic
 * Snapshot Tasks list (`snapshot-task-list.e2e.ts` reaches it from the Data
 * Protection dashboard) scoped to that dataset: its rows are the tasks whose
 * dataset is that one or below it, shown as a chip in the page header, and the
 * search box starts empty. Removing the chip lists every task again. The scope
 * has to survive the list reloading after an edit or a delete.
 *
 * Two bystanders: one on a sibling dataset, and one on another dataset whose
 * naming schema holds the target's name. The list once matched the dataset as a
 * substring of either column, which the second one catches.
 *
 * Every task is scheduled monthly on a dataset of its own, made fresh for each
 * test, so none takes a snapshot while the spec runs, and Delete's confirm
 * offers no second box.
 */
import {
  ensureSnapshotTaskPresent,
  ensureSnapshotTasksAbsent,
  findSnapshotTask,
  findSnapshotTasks,
  monthlySchedule,
} from '../fixtures/snapshot-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { selectDataset } from '../flows/encryption';
import {
  chooseSnapshotTaskLifetimeUnit,
  deleteSnapshotTaskFromList,
  openEditSnapshotTaskFormFromList,
  openSnapshotTaskListForDataset,
  saveSnapshotTaskForm,
} from '../flows/snapshot-tasks';
import { clearDatasetScope } from '../flows/snapshots';
import { taskListLocators } from '../locators/data-protection';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import { datasetScopeLocators, snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset whose card the journey starts on. */
const targetLeaf = 'e2e_dstasks_target';
const targetNamingSchema = 'e2e-dstasks-target-%Y-%m-%d_%H-%M';

/** A sibling dataset's task, which the scope has to hide and every action has to leave alone. */
const bystanderLeaf = 'e2e_dstasks_bystander';
const bystanderNamingSchema = 'e2e-dstasks-bystander-%Y-%m-%d_%H-%M';

/** Another dataset's task whose naming schema holds the target's name: outside the scope all the same. */
const schemaBystanderLeaf = 'e2e_dstasks_schema';
const schemaBystanderNamingSchema = `${targetLeaf}-%Y-%m-%d_%H-%M`;

const allLeaves = [targetLeaf, bystanderLeaf, schemaBystanderLeaf];

/** What `ensureSnapshotTaskPresent` seeds, and what a task nothing acted on still holds. */
const asSeeded = {
  lifetime_value: 2,
  lifetime_unit: 'WEEK',
  schedule: { ...monthlySchedule, begin: '00:00', end: '23:59' },
  enabled: true,
};

interface Seeded {
  target: string;
  bystander: string;
  schemaBystander: string;
}

/** One task on each dataset, over the API: acting on one from the list is the thing under test. */
async function seedTasks(api: E2eApiClient, pool: string): Promise<Seeded> {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  const schemaBystander = `${pool}/${schemaBystanderLeaf}`;
  await ensureSnapshotTaskPresent(api, {
    dataset: target,
    namingSchema: targetNamingSchema,
    schedule: monthlySchedule,
  });
  await ensureSnapshotTaskPresent(api, {
    dataset: bystander,
    namingSchema: bystanderNamingSchema,
    schedule: monthlySchedule,
  });
  await ensureSnapshotTaskPresent(api, {
    dataset: schemaBystander,
    namingSchema: schemaBystanderNamingSchema,
    schedule: monthlySchedule,
  });
  return { target, bystander, schemaBystander };
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

test('View Snapshot Tasks on a dataset opens the task list scoped to that dataset', async ({
  page, api, pool,
}) => {
  const { target, bystander, schemaBystander } = await seedTasks(api, pool);
  const { list } = snapshotTaskLocators;

  // Step by step rather than through `openSnapshotTaskListForDataset`: the
  // card's count is read on the way, and following the link is the story.
  await selectDataset(page, target);
  // This dataset's task alone, not the bystanders' on its siblings.
  await expect(page.locator(snapshotLocators.card.snapshotTasks)).toHaveText('1');
  await page.locator(snapshotLocators.card.viewSnapshotTasks).click();
  await expect(page.locator(list.add)).toBeVisible();

  // The dataset is one route segment, so its slash is encoded. Decoded rather
  // than re-encoded here: the router leaves some characters (`:`, `@`) bare.
  await expect(page).toHaveURL(/\/data-protection\/snapshot\/[^/]+$/);
  const segment = new URL(page.url()).pathname.split('/').pop() ?? '';
  expect(decodeURIComponent(segment)).toBe(target);

  await expect(page.locator(datasetScopeLocators.chip)).toContainText(target);
  await expect(page.locator(taskListLocators.search)).toHaveValue('');
  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeHidden();
  await expect(page.locator(list.row(schemaBystander, schemaBystanderNamingSchema))).toBeHidden();

  // Removing the scope lists the bystanders again, and leaves the route.
  await clearDatasetScope(page);
  await expect(page.locator(list.row(target, targetNamingSchema))).toBeVisible();
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeVisible();
  await expect(page.locator(list.row(schemaBystander, schemaBystanderNamingSchema))).toBeVisible();
  await expect(page).toHaveURL(/\/data-protection\/snapshot\/?$/);

  // Looking is not acting.
  expect(await findSnapshotTask(api, target)).toMatchObject({ ...asSeeded, naming_schema: targetNamingSchema });
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ ...asSeeded, naming_schema: bystanderNamingSchema });
});

test('editing a task from the list a dataset card opened changes that task, and the list stays scoped', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTasks(api, pool);
  const before = await findSnapshotTask(api, target);
  const { list } = snapshotTaskLocators;

  await openSnapshotTaskListForDataset(page, target);
  await openEditSnapshotTaskFormFromList(page, target, targetNamingSchema);
  await chooseSnapshotTaskLifetimeUnit(page, 'DAY');
  await saveSnapshotTaskForm(page);

  // The same record, by id: an update, not a delete and a create.
  await expect.poll(() => findSnapshotTask(api, target)).toMatchObject({
    id: before?.id,
    lifetime_unit: 'DAY',
    lifetime_value: 2,
    naming_schema: targetNamingSchema,
  });
  expect(await findSnapshotTasks(api, target)).toHaveLength(1);
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ ...asSeeded, naming_schema: bystanderNamingSchema });

  // The list re-reads after a save and re-applies the scope it holds.
  await expect(page.locator(datasetScopeLocators.chip)).toContainText(target);
  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeHidden();
});

test('deleting a task from the list a dataset card opened removes that task, and the list stays scoped', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTasks(api, pool);

  await openSnapshotTaskListForDataset(page, target);
  // Waits for the target's row to go, which is the list having re-read.
  await deleteSnapshotTaskFromList(page, target, targetNamingSchema);

  await expect.poll(() => findSnapshotTasks(api, target)).toEqual([]);
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ ...asSeeded, naming_schema: bystanderNamingSchema });

  await expect(page.locator(datasetScopeLocators.chip)).toContainText(target);
  await expect(page.locator(snapshotTaskLocators.list.row(bystander, bystanderNamingSchema))).toBeHidden();
});
