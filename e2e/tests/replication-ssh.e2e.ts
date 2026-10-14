/**
 * Story: an admin creates a push replication task to a different system over an
 * SSH connection, through the wizard on Data Protection, and the target really
 * ends up holding the source's snapshots.
 *
 * The "different system" is the appliance itself, reached over an SSH connection
 * to `127.0.0.1` — see `fixtures/ssh-connections.ts` — so no second appliance is
 * needed and the target is a dataset this spec can read back. Middleware still
 * sends the stream through `ssh`, exactly as it would to another machine: the
 * task's transport and connection are what decide that, not the address.
 *
 * The task is asserted on the card and on the appliance: `replication.query`
 * for the task as stored, `core.get_jobs` for whether the run worked, and
 * `pool.snapshot.query` for what the run actually did, which appears nowhere on
 * the screen.
 *
 * Creating goes through the wizard with Run Once, which snapshots the source,
 * saves the task and starts it. The source is made fresh for each test and no
 * target is: replication creates its own, so a target that exists afterwards is
 * evidence of a run. Local replication is `replication-tasks.e2e.ts`.
 */
import {
  countReplicationTasks,
  ensureReplicationTaskAbsent,
  findReplicationRunJobIds,
  findReplicationRuns,
  findReplicationTask,
  findReplicationTasks,
  findSnapshotNames,
  replicationNamingSchema,
} from '../fixtures/replication-tasks';
import {
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
} from '../fixtures/ssh-connections';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  fillRemoteReplication,
  openReplicationWizard,
  replicationTaskCardPageSize,
  saveReplicationToRunOnce,
} from '../flows/replication-tasks';
import { replicationTaskLocators } from '../locators/replication-tasks';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A run of one empty dataset over loopback SSH is seconds; this is room for a slow appliance. */
const runTimeoutMs = 120_000;

/** The SSH connection the task goes through. Set up over the API: it is not under test. */
const connectionName = 'e2e-replication-loopback';

/** Made through the wizard, never over the API — that is the thing under test. */
const createdName = 'e2e-replication-ssh';
const sourceLeaf = 'e2e_repl_ssh_src';
const targetLeaf = 'e2e_repl_ssh_dst';

let connectionId: number;

/**
 * The connection, root's key and SSH are set up once for the file: none of them
 * is under test. The task goes first because middleware will not delete a
 * connection a task uses, so a run interrupted mid-file leaves the next one able
 * to start.
 */
test.beforeAll(async ({ api }) => {
  await ensureReplicationTaskAbsent(api, createdName);
  connectionId = await ensureLoopbackSshConnectionPresent(api, connectionName);
});

/**
 * Task first, then target, then source, so nothing is left pointing at a dataset
 * that is gone. Run before each test as well as after, so no target exists until
 * a run makes it.
 */
test.beforeEach(async ({ api, pool }) => {
  await ensureReplicationTaskAbsent(api, createdName);
  await ensureDatasetAbsent(api, `${pool}/${targetLeaf}`);
  await ensureDatasetAbsent(api, `${pool}/${sourceLeaf}`);
  await ensureDatasetPresent(api, `${pool}/${sourceLeaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const datasets = [`${pool}/${targetLeaf}`, `${pool}/${sourceLeaf}`];
  if (leavingTestData(`the replication task ${createdName} and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the replication task "${createdName}"`, () => ensureReplicationTaskAbsent(api, createdName)],
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

/** Separate steps, so a connection that will not delete still has root's key taken back out. */
test.afterAll(async ({ api }) => {
  if (leavingTestData(`the SSH connection "${connectionName}", its keypair and root's key`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the replication task "${createdName}"`, () => ensureReplicationTaskAbsent(api, createdName)],
    [`remove the SSH connection "${connectionName}"`, () => ensureSshConnectionAbsent(api, connectionName)],
    ['remove root\'s loopback key, its keypair, and SSH if it was started', () => (
      ensureLoopbackSshAccessAbsent(api, connectionName)
    )],
  ]);
});

test('creating a replication task over an SSH connection with Run Once replicates the source', async ({
  page, api, pool,
}) => {
  const source = `${pool}/${sourceLeaf}`;
  const target = `${pool}/${targetLeaf}`;
  // The card lists four tasks before its pager, and the pager leaves for the full list.
  const existing = await countReplicationTasks(api);
  expect(
    existing + 1 <= replicationTaskCardPageSize,
    `the card lists ${replicationTaskCardPageSize} tasks, this test adds 1, the appliance has ${existing}`,
  ).toBe(true);
  const earlierRuns = await findReplicationRunJobIds(api);

  await openReplicationWizard(page);
  await fillRemoteReplication(page, {
    source, target, name: createdName, connection: connectionName,
  });
  expect(await saveReplicationToRunOnce(page)).toBe('Task started');

  await expect(page.locator(replicationTaskLocators.card.name(createdName))).toHaveText(createdName);

  expect(await findReplicationTasks(api, createdName)).toHaveLength(1);
  const task = await findReplicationTask(api, createdName);
  expect(task).toMatchObject({
    direction: 'PUSH',
    // The wizard's default for a different system: encrypted, over the connection.
    transport: 'SSH',
    ssh_credentials: { id: connectionId },
    source_datasets: [source],
    target_dataset: target,
    recursive: false,
    auto: false,
    also_include_naming_schema: [replicationNamingSchema],
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
