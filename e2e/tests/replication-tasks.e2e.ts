/**
 * Stories: an admin creates a replication task between two datasets on the same
 * appliance, and runs one, from the card on Data Protection — and the target
 * really ends up holding the source's snapshots. They also edit and delete a
 * task from the card, and the appliance holds what they did.
 *
 * Each action is asserted on the card and on the appliance: `replication.query`
 * for the task as stored, `core.get_jobs` for whether the run worked, and
 * `pool.snapshot.query` for what the run actually did, which is the point of a
 * replication and appears nowhere on the screen.
 *
 * Creating goes through the wizard with Run Once, which is the one path where
 * the UI does both halves itself: it snapshots the source, because there is
 * nothing to send yet, saves the task, and starts it. Running, editing and
 * deleting from the card each act beside a second task that must come through
 * untouched. The row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug would act on the
 * wrong task without failing anything else.
 *
 * Edit opens the full replication form rather than the wizard. The edit renames
 * the task, and the row's ids are built from its name, so the renamed row is
 * found under its new name and the old one must be gone.
 *
 * Restore makes the reverse task and runs nothing, so the restore test runs the
 * original over the API first — that run is setup, not the thing under test —
 * and then runs the restored task from the card into a dataset that did not
 * exist, which holding the original's snapshot afterwards proves was a pull back.
 *
 * Download keys is offered only for a source whose key middleware stores, which
 * a passphrase never is. The source is encrypted with a key the test chooses,
 * so the file can be checked for that exact key rather than for its shape.
 *
 * Every plain source dataset is made fresh for each test. No target is:
 * replication creates its own, so a target that exists afterwards is evidence of
 * a run.
 */
import { readFile } from 'node:fs/promises';
import { ensureKeyEncryptedDatasetPresent } from '../fixtures/encryption';
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
  runReplicationTaskOverApi,
} from '../fixtures/replication-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import {
  chooseReplicationReadonlyPolicy,
  deleteReplicationTask,
  downloadReplicationTaskKeys,
  fillLocalReplication,
  openEditReplicationTaskForm,
  openReplicationWizard,
  replicationTaskCardPageSize,
  restoreReplicationTask,
  runReplicationTask,
  saveReplicationTaskForm,
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

/** Provisioned over the API, so there is something to run, edit or delete. */
const runName = 'e2e-replication-run';
const runSourceLeaf = 'e2e_repl_run_src';
const runTargetLeaf = 'e2e_repl_run_dst';

/** What the edit test renames that task to, and the retry count it gives it. */
const editedName = 'e2e-replication-edited';
const editedRetries = 2;

/** Provisioned beside it, and must come through whatever is done to it untouched. */
const bystanderName = 'e2e-replication-bystander';
const bystanderSourceLeaf = 'e2e_repl_bystander_src';
const bystanderTargetLeaf = 'e2e_repl_bystander_dst';

/** Matches {@link replicationNamingSchema}, and is long past, so nothing the appliance takes can collide with it. */
const seededSnapshot = 'auto-2000-01-01_00-00';

/** What a restore from the run task names the reverse task, and where it pulls the data back to. */
const restoredName = 'e2e-replication-restored';
const restoredTargetLeaf = 'e2e_repl_restored_dst';

/** A task whose source is encrypted with {@link keysSourceKey}, so Download keys is offered for it. */
const keysName = 'e2e-replication-keys';
const keysSourceLeaf = 'e2e_repl_keys_src';
const keysTargetLeaf = 'e2e_repl_keys_dst';

/** Sixty-four hex digits, the form middleware takes a raw key in. Test data, not a secret. */
const keysSourceKey = '0123456789abcdef'.repeat(4);

const allNames = [createdName, runName, editedName, bystanderName, restoredName, keysName];
const sourceLeaves = [createdSourceLeaf, runSourceLeaf, bystanderSourceLeaf];
const targetLeaves = [createdTargetLeaf, runTargetLeaf, bystanderTargetLeaf, restoredTargetLeaf, keysTargetLeaf];

/** Made encrypted by the one test that needs it, so only ever removed here, never made plain. */
const encryptedSourceLeaves = [keysSourceLeaf];

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

/** Both tasks over the API: acting on one from the card is the thing under test. */
async function seedTaskAndBystander(api: E2eApiClient, pool: string): Promise<void> {
  await ensureReplicationTaskPresent(api, {
    name: runName, source: `${pool}/${runSourceLeaf}`, target: `${pool}/${runTargetLeaf}`,
  });
  await ensureReplicationTaskPresent(api, {
    name: bystanderName, source: `${pool}/${bystanderSourceLeaf}`, target: `${pool}/${bystanderTargetLeaf}`,
  });
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
  for (const leaf of [...targetLeaves, ...sourceLeaves, ...encryptedSourceLeaves]) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
  for (const leaf of sourceLeaves) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = [...targetLeaves, ...sourceLeaves, ...encryptedSourceLeaves].map((leaf) => `${pool}/${leaf}`);
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
  await seedTaskAndBystander(api, pool);
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

test('editing a replication task from the card changes the task that was picked', async ({ page, api, pool }) => {
  await requireRoomOnCard(api, 2);
  await seedTaskAndBystander(api, pool);
  const before = await findReplicationTask(api, runName);
  const bystanderBefore = await findReplicationTask(api, bystanderName);
  if (!before || !bystanderBefore) {
    throw new Error(`the seeded tasks "${runName}" and "${bystanderName}" are not both on the appliance`);
  }
  // Each value the edit sets has to differ from what the task starts with, or
  // the readback below would pass without the edit having landed.
  expect(before).toMatchObject({ readonly: 'IGNORE', enabled: true });
  expect(before.retries).not.toBe(editedRetries);

  const { form, card } = replicationTaskLocators;
  await openEditReplicationTaskForm(page, runName);
  await page.locator(form.name).fill(editedName);
  await page.locator(form.retries).fill(String(editedRetries));
  await chooseReplicationReadonlyPolicy(page, 'SET');
  await page.locator(form.enabled).click();
  await saveReplicationTaskForm(page);

  await expect(page.locator(card.name(editedName))).toHaveText(editedName);
  await expect(page.locator(card.row(runName))).toBeHidden();

  // The same record, by id, under its new name and no longer under the old one:
  // an update, not a delete and a create that leave the card looking the same.
  expect(await findReplicationTasks(api, runName)).toEqual([]);
  expect(await findReplicationTasks(api, editedName)).toHaveLength(1);
  expect(await findReplicationTask(api, editedName)).toMatchObject({
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

test('deleting a replication task from the card removes the task that was picked', async ({ page, api, pool }) => {
  await requireRoomOnCard(api, 2);
  await seedTaskAndBystander(api, pool);

  await deleteReplicationTask(page, runName);

  // Polled rather than read once: the card reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findReplicationTasks(api, runName)).toEqual([]);

  // The whole point of the second task: the card looks right either way.
  await expect(page.locator(replicationTaskLocators.card.name(bystanderName))).toHaveText(bystanderName);
  expect(await findReplicationTasks(api, bystanderName)).toHaveLength(1);
});

test('restoring from a replication task creates the reverse task, and running it brings the data back', async ({
  page, api, pool,
}) => {
  const source = `${pool}/${runSourceLeaf}`;
  const target = `${pool}/${runTargetLeaf}`;
  const restoredTarget = `${pool}/${restoredTargetLeaf}`;
  await requireRoomOnCard(api, 2);

  // Setup: the original has run, so its target holds something to bring back.
  await createSnapshot(api, source, seededSnapshot);
  await ensureReplicationTaskPresent(api, { name: runName, source, target });
  const task = await findReplicationTask(api, runName);
  if (!task) {
    throw new Error(`the seeded task "${runName}" is not on the appliance`);
  }
  await runReplicationTaskOverApi(api, task.id, runTimeoutMs);
  expect(await findSnapshotNames(api, target)).toEqual([seededSnapshot]);

  await restoreReplicationTask(page, runName, { restoredName, destination: restoredTarget });

  await expect(page.locator(replicationTaskLocators.card.name(restoredName))).toHaveText(restoredName);

  // The reverse of the original: a pull from where it sent the data, matched by
  // the schema it sent, and left for the admin to run.
  expect(await findReplicationTasks(api, restoredName)).toHaveLength(1);
  const restored = await findReplicationTask(api, restoredName);
  if (!restored) {
    throw new Error(`the restore did not leave a task named "${restoredName}"`);
  }
  expect(restored).toMatchObject({
    direction: 'PULL',
    transport: 'LOCAL',
    source_datasets: [target],
    target_dataset: restoredTarget,
    naming_schema: [replicationNamingSchema],
    recursive: false,
    auto: false,
    enabled: false,
  });
  expect(await findReplicationTask(api, runName)).toMatchObject({
    id: task.id,
    direction: 'PUSH',
    source_datasets: [source],
    target_dataset: target,
  });

  // Restore runs nothing, so the destination is made by the run below or not at all.
  expect(await findDataset(api, restoredTarget)).toBeUndefined();
  const restoredId = restored.id;
  const earlierRuns = await findReplicationRunJobIds(api);

  await runReplicationTask(page, restoredName);

  await expect.poll(
    async () => (await findReplicationRuns(api, restoredId, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findSnapshotNames(api, restoredTarget)).toEqual([seededSnapshot]);
});

test('downloading keys for an encrypted replication task saves the key its target needs', async ({
  page, api, pool,
}) => {
  const target = `${pool}/${keysTargetLeaf}`;
  await requireRoomOnCard(api, 1);

  await ensureKeyEncryptedDatasetPresent(api, `${pool}/${keysSourceLeaf}`, keysSourceKey);
  await ensureReplicationTaskPresent(api, { name: keysName, source: `${pool}/${keysSourceLeaf}`, target });

  const download = await downloadReplicationTaskKeys(page, keysName);

  expect(download.suggestedFilename()).toBe(`${keysName}_encryption_keys.json`);
  const contents: unknown = JSON.parse(await readFile(await download.path(), 'utf8'));
  // Keyed by where the data lands, since that is the dataset the key unlocks.
  expect(contents).toEqual({ [target]: keysSourceKey });
});
