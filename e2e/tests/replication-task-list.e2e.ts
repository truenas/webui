/**
 * Stories: an admin opens the full Replication Tasks list from its card on Data
 * Protection, searches it down to the task they want, and runs, edits, switches
 * off and on, and deletes a task from its row. The appliance holds what they did.
 *
 * The card's own journeys are `replication-tasks.e2e.ts`. The list is a
 * different page, with its own search, its own Enabled switch, and its actions
 * in a detail panel that opens when the row is clicked rather than in a kebab
 * menu. Its ids are its own too (see `replicationTaskLocators.list`), so nothing
 * the card spec passes says anything about it.
 *
 * Every action acts beside a second task that must come through untouched. The
 * panel's actions are keyed by the task's id, so an action belongs to whichever
 * row was opened, and a row-targeting bug would act on the wrong task without
 * failing anything else.
 *
 * Every task is local, between two datasets on this appliance, made fresh for
 * each test. No target is made: replication creates its own, so a target that
 * exists afterwards is evidence of a run.
 */
import {
  createSnapshot,
  ensureReplicationTaskAbsent,
  ensureReplicationTaskPresent,
  findReplicationRunJobIds,
  findReplicationRuns,
  findReplicationTask,
  findReplicationTasks,
  findSnapshotNames,
  replicationNamingSchema,
  type ReplicationTaskRecord,
} from '../fixtures/replication-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { searchTaskList } from '../flows/data-protection';
import {
  chooseReplicationReadonlyPolicy,
  deleteReplicationTaskFromList,
  openEditReplicationTaskFormFromList,
  openReplicationTaskList,
  runReplicationTaskFromList,
  saveReplicationTaskForm,
  toggleReplicationTaskEnabledInList,
} from '../flows/replication-tasks';
import { replicationTaskLocators } from '../locators/replication-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ laneSpec: 'replication-task-list' });

/** A run of one empty dataset is seconds; this is room for a slow appliance, not an estimate. */
const runTimeoutMs = 120_000;

/** The task an action is aimed at. */
const targetName = 'e2e-repllist-target';
const targetSourceLeaf = 'e2e_repllist_target_src';
const targetTargetLeaf = 'e2e_repllist_target_dst';

/** The retry count the edit test gives the target. */
const editedRetries = 2;

/** The task that must come through whatever is done to the target untouched. */
const bystanderName = 'e2e-repllist-bystander';
const bystanderSourceLeaf = 'e2e_repllist_bystander_src';
const bystanderTargetLeaf = 'e2e_repllist_bystander_dst';

/** Matches {@link replicationNamingSchema}, and is long past, so nothing the appliance takes can collide with it. */
const seededSnapshot = 'auto-2000-01-01_00-00';

const allNames = [targetName, bystanderName];
const sourceLeaves = [targetSourceLeaf, bystanderSourceLeaf];
const targetLeaves = [targetTargetLeaf, bystanderTargetLeaf];

/** Both tasks over the API: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(
  api: E2eApiClient,
  pool: string,
): Promise<{ target: ReplicationTaskRecord; bystander: ReplicationTaskRecord }> {
  await ensureReplicationTaskPresent(api, {
    name: targetName, source: `${pool}/${targetSourceLeaf}`, target: `${pool}/${targetTargetLeaf}`,
  });
  await ensureReplicationTaskPresent(api, {
    name: bystanderName, source: `${pool}/${bystanderSourceLeaf}`, target: `${pool}/${bystanderTargetLeaf}`,
  });

  const target = await findReplicationTask(api, targetName);
  const bystander = await findReplicationTask(api, bystanderName);
  // The list's actions are keyed by id, so without both there is nothing to aim at.
  if (!target || !bystander) {
    throw new Error(`the seeded tasks "${targetName}" and "${bystanderName}" are not both on the appliance`);
  }
  return { target, bystander };
}

/**
 * Tasks first, then targets, then sources, so nothing is left pointing at a
 * dataset that is gone. Deleting a dataset takes its snapshots with it. Run
 * before each test as well as after, so an interrupted run leaves the next one
 * able to start, and so that no target exists until a run makes it.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const name of allNames) {
    await ensureReplicationTaskAbsent(api, name);
  }
  for (const leaf of [...targetLeaves, ...sourceLeaves]) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
  for (const leaf of sourceLeaves) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = [...targetLeaves, ...sourceLeaves].map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the replication tasks ${allNames.join(', ')} and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...allNames.map((name): [string, () => Promise<void>] => [
      `remove the replication task "${name}"`, () => ensureReplicationTaskAbsent(api, name),
    ]),
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

test('searching the full Replication Tasks list narrows it to the task that matches', async ({
  page, api, pool,
}) => {
  await seedTargetAndBystander(api, pool);
  const { list } = replicationTaskLocators;

  await openReplicationTaskList(page);
  // Both are listed before the search, so the bystander going is the search's doing.
  await expect(page.locator(list.row(targetName))).toBeVisible();
  await expect(page.locator(list.row(bystanderName))).toBeVisible();

  // By name, the one column the list searches. No other task's name holds it.
  await searchTaskList(page, targetName);

  await expect(page.locator(list.name(targetName))).toHaveText(targetName);
  await expect(page.locator(list.anyRow)).toHaveCount(1);
});

test('running a replication task from the full list replicates the task that was picked', async ({
  page, api, pool,
}) => {
  await createSnapshot(api, `${pool}/${targetSourceLeaf}`, seededSnapshot);
  await createSnapshot(api, `${pool}/${bystanderSourceLeaf}`, seededSnapshot);
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const earlierRuns = await findReplicationRunJobIds(api);

  await runReplicationTaskFromList(page, { name: targetName, id: target.id });

  await expect.poll(
    async () => (await findReplicationRuns(api, target.id, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findSnapshotNames(api, `${pool}/${targetTargetLeaf}`)).toEqual([seededSnapshot]);

  // The whole point of the second task: the list looks the same either way.
  await expect(page.locator(replicationTaskLocators.list.row(bystanderName))).toBeVisible();
  expect(await findReplicationRuns(api, bystander.id, earlierRuns)).toEqual([]);
  expect(await findDataset(api, `${pool}/${bystanderTargetLeaf}`)).toBeUndefined();
});

test('editing a replication task from the full list changes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target: before, bystander: bystanderBefore } = await seedTargetAndBystander(api, pool);
  // Each value the edit sets has to differ from what the task starts with, or
  // the readback below would pass without the edit having landed.
  expect(before).toMatchObject({ readonly: 'IGNORE', enabled: true });
  expect(before.retries).not.toBe(editedRetries);

  const { form, list } = replicationTaskLocators;
  await openEditReplicationTaskFormFromList(page, { name: targetName, id: before.id });
  await page.locator(form.retries).fill(String(editedRetries));
  await chooseReplicationReadonlyPolicy(page, 'SET');
  await page.locator(form.enabled).click();
  await saveReplicationTaskForm(page);

  // The name did not change, so the row keeps its ids.
  await expect(page.locator(list.name(targetName))).toHaveText(targetName);

  // The same record, by id, and still the only one with this name: an update,
  // not a delete and a create that happen to leave the list looking the same.
  expect(await findReplicationTasks(api, targetName)).toHaveLength(1);
  expect(await findReplicationTask(api, targetName)).toMatchObject({
    id: before.id,
    retries: editedRetries,
    readonly: 'SET',
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    direction: 'PUSH',
    transport: 'LOCAL',
    source_datasets: before.source_datasets,
    target_dataset: before.target_dataset,
    auto: false,
    also_include_naming_schema: [replicationNamingSchema],
    retention_policy: before.retention_policy,
  });

  expect(await findReplicationTask(api, bystanderName)).toMatchObject({
    id: bystanderBefore.id,
    retries: bystanderBefore.retries,
    readonly: 'IGNORE',
    enabled: true,
  });
});

test('the Enabled switch on the full Replication Tasks list turns that task off and on again', async ({
  page, api, pool,
}) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const enabled = async (name: string): Promise<boolean | undefined> => (
    (await findReplicationTask(api, name))?.enabled
  );
  // Seeded enabled, so a task read back as off can only have been switched off by this click.
  expect(target.enabled).toBe(true);
  expect(bystander.enabled).toBe(true);

  await toggleReplicationTaskEnabledInList(page, targetName);
  await expect.poll(() => enabled(targetName), { message: 'the target after switching it off' }).toBe(false);
  expect(await enabled(bystanderName), 'the bystander while the target is off').toBe(true);

  await toggleReplicationTaskEnabledInList(page, targetName);
  await expect.poll(() => enabled(targetName), { message: 'the target after switching it on' }).toBe(true);
  expect(await enabled(bystanderName), 'the bystander after the target is back on').toBe(true);
});

test('deleting a replication task from the full list removes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target } = await seedTargetAndBystander(api, pool);

  await deleteReplicationTaskFromList(page, { name: targetName, id: target.id });

  // Polled rather than read once: the list reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findReplicationTasks(api, targetName)).toEqual([]);

  // The whole point of the second task: the list looks right either way.
  await expect(page.locator(replicationTaskLocators.list.name(bystanderName))).toHaveText(bystanderName);
  expect(await findReplicationTasks(api, bystanderName)).toHaveLength(1);
});
