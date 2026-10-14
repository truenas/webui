/**
 * Stories: an admin creates a replication task between two datasets on the same
 * appliance, and runs one, from the card on Data Protection — and the target
 * really ends up holding the source's snapshots.
 *
 * Each action is asserted on the card and on the appliance: `replication.query`
 * for the task as stored, `core.get_jobs` for whether the run worked, and
 * `pool.snapshot.query` for what the run actually did, which is the point of a
 * replication and appears nowhere on the screen.
 *
 * Creating goes through the wizard with Run Once, which is the one path where
 * the UI does both halves itself: it snapshots the source, because there is
 * nothing to send yet, saves the task, and starts it. Running from the card acts
 * beside a second task that must not run. The row's actions sit in a kebab
 * menu, so a run belongs to whichever row's menu was opened, and a row-targeting
 * bug would replicate the wrong datasets without failing anything else.
 *
 * Every source dataset is made fresh for each test. No target is: replication
 * creates its own, so a target that exists afterwards is evidence of a run.
 */
import {
  countReplicationTasks,
  createSnapshot,
  ensureReplicationTaskAbsent,
  ensureReplicationTaskPresent,
  findReplicationRunJobIds,
  findReplicationRuns,
  findReplicationTask,
  findReplicationTasks,
  findSnapshotNames,
  replicationNamingSchema,
} from '../fixtures/replication-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import {
  fillLocalReplication,
  openReplicationWizard,
  replicationTaskCardPageSize,
  runReplicationTask,
  saveReplicationToRunOnce,
} from '../flows/replication-tasks';
import { replicationTaskLocators } from '../locators/replication-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A run of one empty dataset is seconds; this is room for a slow appliance, not an estimate. */
const runTimeoutMs = 120_000;

/** Made through the wizard, never over the API — that is the thing under test. */
const createdName = 'e2e-replication-created';
const createdSourceLeaf = 'e2e_repl_created_src';
const createdTargetLeaf = 'e2e_repl_created_dst';

/** Provisioned over the API, so there is something to run. */
const runName = 'e2e-replication-run';
const runSourceLeaf = 'e2e_repl_run_src';
const runTargetLeaf = 'e2e_repl_run_dst';

/** Provisioned beside it, and must not run. */
const bystanderName = 'e2e-replication-bystander';
const bystanderSourceLeaf = 'e2e_repl_bystander_src';
const bystanderTargetLeaf = 'e2e_repl_bystander_dst';

/** Matches {@link replicationNamingSchema}, and is long past, so nothing the appliance takes can collide with it. */
const seededSnapshot = 'auto-2000-01-01_00-00';

const allNames = [createdName, runName, bystanderName];
const sourceLeaves = [createdSourceLeaf, runSourceLeaf, bystanderSourceLeaf];
const targetLeaves = [createdTargetLeaf, runTargetLeaf, bystanderTargetLeaf];

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four tasks before its pager, and the pager leaves for the full
 * list rather than expanding — see `replicationTaskCardPageSize`. A fresh
 * appliance holds none; failing here says why rather than timing out on a
 * hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countReplicationTasks(api);
  expect(
    existing + adding <= replicationTaskCardPageSize,
    `the card lists ${replicationTaskCardPageSize} tasks, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Tasks first, then targets, then sources, so nothing is left pointing at a
 * dataset that is gone. Deleting a dataset takes its snapshots with it. Run
 * before each test as well as after, so an interrupted run leaves the next one
 * able to start — and so that no target exists until a run makes it.
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

test('creating a local replication task with Run Once replicates the source', async ({ page, api, pool }) => {
  const source = `${pool}/${createdSourceLeaf}`;
  const target = `${pool}/${createdTargetLeaf}`;
  await requireRoomOnCard(api, 1);
  const earlierRuns = await findReplicationRunJobIds(api);

  await openReplicationWizard(page);
  await fillLocalReplication(page, { source, target, name: createdName });
  expect(await saveReplicationToRunOnce(page)).toBe('Task started');

  await expect(page.locator(replicationTaskLocators.card.name(createdName))).toHaveText(createdName);

  expect(await findReplicationTasks(api, createdName)).toHaveLength(1);
  const task = await findReplicationTask(api, createdName);
  expect(task).toMatchObject({
    direction: 'PUSH',
    transport: 'LOCAL',
    source_datasets: [source],
    target_dataset: target,
    recursive: false,
    // Run Once: no schedule, and the snapshots it sends are matched by the
    // wizard's default schema rather than by a periodic task.
    auto: false,
    also_include_naming_schema: [replicationNamingSchema],
    retention_policy: 'SOURCE',
    readonly: 'SET',
    enabled: true,
  });

  // The source started with no snapshots, so the wizard took exactly one.
  const sourceSnapshots = await findSnapshotNames(api, source);
  expect(sourceSnapshots).toHaveLength(1);

  // The run is what the wizard started, not one this test asked for.
  await expect.poll(
    async () => (await findReplicationRuns(api, task?.id ?? -1, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findSnapshotNames(api, target)).toEqual(sourceSnapshots);
});

test('running a replication task from the card replicates the task that was picked', async ({ page, api, pool }) => {
  const source = `${pool}/${runSourceLeaf}`;
  const target = `${pool}/${runTargetLeaf}`;
  const bystanderTarget = `${pool}/${bystanderTargetLeaf}`;
  await requireRoomOnCard(api, 2);

  await createSnapshot(api, source, seededSnapshot);
  await createSnapshot(api, `${pool}/${bystanderSourceLeaf}`, seededSnapshot);
  await ensureReplicationTaskPresent(api, { name: runName, source, target });
  await ensureReplicationTaskPresent(api, {
    name: bystanderName, source: `${pool}/${bystanderSourceLeaf}`, target: bystanderTarget,
  });
  const task = await findReplicationTask(api, runName);
  const bystander = await findReplicationTask(api, bystanderName);
  const earlierRuns = await findReplicationRunJobIds(api);

  await runReplicationTask(page, runName);

  await expect.poll(
    async () => (await findReplicationRuns(api, task?.id ?? -1, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findSnapshotNames(api, target)).toEqual([seededSnapshot]);

  // The whole point of the second task: the card looks the same either way.
  await expect(page.locator(replicationTaskLocators.card.row(bystanderName))).toBeVisible();
  expect(await findReplicationRuns(api, bystander?.id ?? -1, earlierRuns)).toEqual([]);
  expect(await findDataset(api, bystanderTarget)).toBeUndefined();
});
