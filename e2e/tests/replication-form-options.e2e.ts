/**
 * Stories: an admin edits a replication task in the full replication form, sets
 * a snapshot retention policy, picks snapshots by naming schema rather than by a
 * regular expression, or turns on encryption of the target — and the appliance
 * saves it, and running the task does what was set.
 *
 * Edit opens the full form, `ix-replication-form`, which is the only place these
 * options are offered for an existing task; the wizard is for creating one. Each
 * test seeds one local task over the API, edits it from the full list, reads the
 * task back through `replication.query`, then runs it from the list. The list,
 * not the card, so a busy appliance cannot push the row behind the card's pager.
 *
 * What a run did is read through `pool.snapshot.query` and `pool.dataset.query`,
 * since none of it appears on the screen:
 *
 * - Retention. The target first receives two snapshots over the API, under the
 *   seeded policy of None. The older one is then deleted on the source, and
 *   the edit sets Same as Source. Middleware runs retention after a task
 *   finishes, in a pass of its own, so the target losing that snapshot is
 *   polled for rather than read once.
 * - Naming schema. The seeded task picks snapshots by a regular expression that
 *   matches nothing. The edit switches it to a naming schema that matches one of
 *   the source's two snapshots. The target holding that one and not the other
 *   is the schema being followed.
 * - Encryption. The edit sets a HEX key the test chooses, stored on this
 *   appliance. The target the run makes is then encrypted, as its own
 *   encryption root, with a HEX key.
 *
 * Every source dataset is made fresh for each test. No target is: replication
 * creates its own, so a target that exists afterwards is evidence of a run.
 */
import type { Page } from '@playwright/test';
import {
  createSnapshot,
  deleteSnapshot,
  ensureReplicationTaskAbsent,
  ensureReplicationTaskPresent,
  findReplicationRunJobIds,
  findReplicationRuns,
  findReplicationTask,
  findSnapshotNames,
  runReplicationTaskOverApi,
  type ReplicationTaskRecord,
} from '../fixtures/replication-tasks';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import {
  chooseReplicationRetentionPolicy,
  encryptReplicationTargetWithHexKey,
  openEditReplicationTaskFormFromList,
  runReplicationTaskFromList,
  saveReplicationTaskForm,
  useReplicationNamingSchema,
} from '../flows/replication-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ laneSpec: 'replication-form-options' });

/** A run of one empty dataset is seconds; this is room for a slow appliance, not an estimate. */
const runTimeoutMs = 120_000;

/** The retention test's task. */
const retentionName = 'e2e-replopt-retention';
const retentionSourceLeaf = 'e2e_replopt_retention_src';
const retentionTargetLeaf = 'e2e_replopt_retention_dst';

/** The naming schema test's task. */
const schemaName = 'e2e-replopt-schema';
const schemaSourceLeaf = 'e2e_replopt_schema_src';
const schemaTargetLeaf = 'e2e_replopt_schema_dst';

/** The encryption test's task. */
const encryptionName = 'e2e-replopt-encryption';
const encryptionSourceLeaf = 'e2e_replopt_encryption_src';
const encryptionTargetLeaf = 'e2e_replopt_encryption_dst';

/**
 * Both match the seeded task's naming schema, and are long past, so nothing the
 * appliance takes can collide with them. The older one is what retention removes.
 */
const olderSnapshot = 'auto-2000-01-01_00-00';
const newerSnapshot = 'auto-2000-01-02_00-00';

/** What the naming schema test switches to, and the one source snapshot it matches. */
const manualNamingSchema = 'manual-%Y-%m-%d_%H-%M';
const manualSnapshot = 'manual-2000-01-01_00-00';

/** What the naming schema test seeds instead: a regular expression no snapshot here matches. */
const unmatchedNameRegex = '^e2e-matches-nothing$';

/** Sixty-four hex digits, the form middleware takes a raw key in. Test data, not a secret. */
const targetKey = 'fedcba9876543210'.repeat(4);

const allNames = [retentionName, schemaName, encryptionName];
const sourceLeaves = [retentionSourceLeaf, schemaSourceLeaf, encryptionSourceLeaf];
const targetLeaves = [retentionTargetLeaf, schemaTargetLeaf, encryptionTargetLeaf];

/** One task over the API: editing it in the form is the thing under test. */
async function seedTask(
  api: E2eApiClient,
  values: { name: string; source: string; target: string; nameRegex?: string },
): Promise<ReplicationTaskRecord> {
  await ensureReplicationTaskPresent(api, values);

  const task = await findReplicationTask(api, values.name);
  // The list's actions are keyed by id, so without it there is nothing to aim at.
  if (!task) {
    throw new Error(`the seeded task "${values.name}" is not on the appliance`);
  }
  return task;
}

/** Runs a task from the list, and waits for that run, and only that run, to succeed. */
async function runFromListAndWait(
  page: Page,
  api: E2eApiClient,
  task: { name: string; id: number },
): Promise<void> {
  const earlierRuns = await findReplicationRunJobIds(api);

  await runReplicationTaskFromList(page, task);

  await expect.poll(
    async () => (await findReplicationRuns(api, task.id, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
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

test('Same as Source retention set in the form is saved, and a run prunes what the source dropped', async ({
  page, api, pool,
}) => {
  const source = `${pool}/${retentionSourceLeaf}`;
  const target = `${pool}/${retentionTargetLeaf}`;

  // Setup: the target holds both snapshots, under a policy that keeps everything.
  await createSnapshot(api, source, olderSnapshot);
  await createSnapshot(api, source, newerSnapshot);
  const before = await seedTask(api, { name: retentionName, source, target });
  expect(before.retention_policy).toBe('NONE');
  await runReplicationTaskOverApi(api, before.id, runTimeoutMs);
  expect(await findSnapshotNames(api, target)).toEqual([olderSnapshot, newerSnapshot]);

  // The source lets go of the older one. The newer stays, so the run has a common
  // snapshot to start from and sends nothing.
  await deleteSnapshot(api, source, olderSnapshot);

  await openEditReplicationTaskFormFromList(page, { name: retentionName, id: before.id });
  await chooseReplicationRetentionPolicy(page, 'Same as Source');
  await saveReplicationTaskForm(page);

  expect(await findReplicationTask(api, retentionName)).toMatchObject({
    id: before.id,
    retention_policy: 'SOURCE',
  });

  await runFromListAndWait(page, api, { name: retentionName, id: before.id });

  // Retention is a pass of its own after the task finishes, so it is polled for.
  await expect.poll(() => findSnapshotNames(api, target), { timeout: runTimeoutMs }).toEqual([newerSnapshot]);
});

test('a naming schema set in the form instead of a regex is saved, and a run sends only what it matches', async ({
  page, api, pool,
}) => {
  const source = `${pool}/${schemaSourceLeaf}`;
  const target = `${pool}/${schemaTargetLeaf}`;

  // One snapshot the new schema matches and one it does not.
  await createSnapshot(api, source, olderSnapshot);
  await createSnapshot(api, source, manualSnapshot);
  const before = await seedTask(api, {
    name: schemaName,
    source,
    target,
    nameRegex: unmatchedNameRegex,
  });
  // Picking by regex to start with, so the schema read back below can only be the edit's.
  expect(before).toMatchObject({ name_regex: unmatchedNameRegex, also_include_naming_schema: [] });

  await openEditReplicationTaskFormFromList(page, { name: schemaName, id: before.id });
  await useReplicationNamingSchema(page, manualNamingSchema);
  await saveReplicationTaskForm(page);

  expect(await findReplicationTask(api, schemaName)).toMatchObject({
    id: before.id,
    name_regex: null,
    also_include_naming_schema: [manualNamingSchema],
    periodic_snapshot_tasks: [],
  });

  await runFromListAndWait(page, api, { name: schemaName, id: before.id });

  expect(await findSnapshotNames(api, target)).toEqual([manualSnapshot]);
});

test('encryption with a HEX key set in the form is saved, and a run makes an encrypted target', async ({
  page, api, pool,
}) => {
  const source = `${pool}/${encryptionSourceLeaf}`;
  const target = `${pool}/${encryptionTargetLeaf}`;

  await createSnapshot(api, source, olderSnapshot);
  const before = await seedTask(api, { name: encryptionName, source, target });
  expect(before.encryption).toBe(false);

  await openEditReplicationTaskFormFromList(page, { name: encryptionName, id: before.id });
  await encryptReplicationTargetWithHexKey(page, targetKey);
  await saveReplicationTaskForm(page);

  const saved = await findReplicationTask(api, encryptionName);
  expect(saved).toMatchObject({
    id: before.id,
    encryption: true,
    encryption_key_format: 'HEX',
    encryption_key: targetKey,
    // The form's "Store Encryption key in Sending TrueNAS database", which it leaves ticked.
    encryption_key_location: '$TrueNAS',
  });
  // Not inheriting. A task saved without encryption holds null here, and the form sends back the
  // value it loaded while Inherit Encryption stays unticked, so this is null rather than false.
  expect(saved?.encryption_inherit).toBeFalsy();

  await runFromListAndWait(page, api, { name: encryptionName, id: before.id });

  expect(await findSnapshotNames(api, target)).toEqual([olderSnapshot]);
  // The source is not encrypted, so an encrypted target is the run following the task.
  expect(await findDataset(api, source)).toMatchObject({ encrypted: false });
  expect(await findDataset(api, target)).toMatchObject({
    encrypted: true,
    encryption_root: target,
    key_format: { value: 'HEX' },
  });
});
