/**
 * Stories: an admin on a dataset opens its periodic snapshot tasks from the
 * dataset's Data Protection card, by "View Snapshot Tasks", and edits and
 * deletes a task from the list that link opens. The appliance holds what they did.
 *
 * The link goes to `/data-protection/snapshot/<dataset>`, which is the full
 * Periodic Snapshot Tasks list (`snapshot-task-list.e2e.ts` reaches it from the
 * Data Protection dashboard). The list does not filter by route: it copies the
 * dataset into its search box, and the search then matches it as a substring of
 * the Pool/Dataset or Naming Schema column. So "filtered to the dataset" is a
 * search a user can see and clear, and it has to survive the list reloading
 * after an edit or a delete.
 *
 * The bystander's dataset and naming schema are picked so that neither holds
 * the target's path: the search hides it for being another dataset's task, not
 * by accident.
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
import { searchTaskList } from '../flows/data-protection';
import { selectDataset } from '../flows/encryption';
import {
  chooseSnapshotTaskLifetimeUnit,
  deleteSnapshotTaskFromList,
  openEditSnapshotTaskFormFromList,
  openSnapshotTaskListForDataset,
  saveSnapshotTaskForm,
} from '../flows/snapshot-tasks';
import { taskListLocators } from '../locators/data-protection';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import { snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset whose card the journey starts on. */
const targetLeaf = 'e2e_dstasks_target';
const targetNamingSchema = 'e2e-dstasks-target-%Y-%m-%d_%H-%M';

/** Another dataset's task, which the search has to hide and every action has to leave alone. */
const bystanderLeaf = 'e2e_dstasks_bystander';
const bystanderNamingSchema = 'e2e-dstasks-bystander-%Y-%m-%d_%H-%M';

const allLeaves = [targetLeaf, bystanderLeaf];

/** What `ensureSnapshotTaskPresent` seeds, and what a task nothing acted on still holds. */
const asSeeded = {
  lifetime_value: 2,
  lifetime_unit: 'WEEK',
  schedule: { ...monthlySchedule, begin: '00:00', end: '23:59' },
  enabled: true,
};

/** One task on each dataset, over the API: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<{ target: string; bystander: string }> {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
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

test('View Snapshot Tasks on a dataset opens the task list searched down to that dataset', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const { list } = snapshotTaskLocators;

  // Step by step rather than through `openSnapshotTaskListForDataset`: the
  // card's count is read on the way, and following the link is the story.
  await selectDataset(page, target);
  // This dataset's task alone, not the bystander's on its sibling.
  await expect(page.locator(snapshotLocators.card.snapshotTasks)).toHaveText('1');
  await page.locator(snapshotLocators.card.viewSnapshotTasks).click();
  await expect(page.locator(list.add)).toBeVisible();

  // The dataset is one route segment, so its slash is encoded.
  await expect(page).toHaveURL(/\/data-protection\/snapshot\/[^/]+$/);
  expect(new URL(page.url()).pathname).toBe(`/data-protection/snapshot/${encodeURIComponent(target)}`);

  await expect(page.locator(taskListLocators.search)).toHaveValue(target);
  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeHidden();

  // The search is the whole of the filtering: clearing it lists the bystander again.
  await searchTaskList(page, '');
  await expect(page.locator(list.row(target, targetNamingSchema))).toBeVisible();
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeVisible();

  // Looking is not acting.
  expect(await findSnapshotTask(api, target)).toMatchObject({ ...asSeeded, naming_schema: targetNamingSchema });
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ ...asSeeded, naming_schema: bystanderNamingSchema });
});

test('editing a task from the list a dataset card opened changes that task, and the list stays searched', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
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

  // The list re-reads after a save and re-applies the search it holds.
  await expect(page.locator(taskListLocators.search)).toHaveValue(target);
  await expect(page.locator(list.dataset(target, targetNamingSchema))).toHaveText(target);
  await expect(page.locator(list.row(bystander, bystanderNamingSchema))).toBeHidden();
});

test('deleting a task from the list a dataset card opened removes that task, and the list stays searched', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);

  await openSnapshotTaskListForDataset(page, target);
  // Waits for the target's row to go, which is the list having re-read.
  await deleteSnapshotTaskFromList(page, target, targetNamingSchema);

  await expect.poll(() => findSnapshotTasks(api, target)).toEqual([]);
  expect(await findSnapshotTask(api, bystander)).toMatchObject({ ...asSeeded, naming_schema: bystanderNamingSchema });

  await expect(page.locator(taskListLocators.search)).toHaveValue(target);
  await expect(page.locator(snapshotTaskLocators.list.row(bystander, bystanderNamingSchema))).toBeHidden();
});
