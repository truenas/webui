/**
 * Story: an admin runs a rsync task from the card on Data Protection with Run
 * Now, the job completes, and the files really are copied to the target path.
 *
 * The task pushes over SSH through an SSH connection back to the appliance
 * itself — see `fixtures/ssh-connections.ts` — so no second machine is needed
 * and the target is a dataset this spec can read back. Middleware still runs
 * rsync over `ssh` exactly as it would to another host: the mode and the
 * connection decide that, not the address.
 *
 * The run is asserted on the card and on the appliance: the row's state for
 * what the screen said, `core.get_jobs` for whether the job worked, and
 * `filesystem.listdir` for what it copied, which appears nowhere on the screen.
 *
 * The run acts beside a second task that must not run. The row's actions sit in
 * a kebab menu, so Run job belongs to whichever row's menu was opened, and a
 * row-targeting bug would run the wrong task without failing anything else.
 *
 * Add, edit and delete are `rsync-tasks.e2e.ts`. SSH mode settings and Pull are
 * #14408's.
 */
import { findFileNames, writeFileOnAppliance } from '../fixtures/cloud-sync';
import {
  countRsyncTasks,
  ensureRsyncSshTaskPresent,
  ensureRsyncTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncRunJobIds,
  findRsyncRuns,
  findRsyncTask,
  rsyncRemoteHost,
  type RsyncTaskSchedule,
} from '../fixtures/rsync-tasks';
import { directoryExists } from '../fixtures/snapshots';
import {
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
} from '../fixtures/ssh-connections';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { rsyncTaskCardPageSize, runRsyncTaskFromCard } from '../flows/rsync-tasks';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A push of one small file over loopback SSH is seconds; this is room for a slow appliance. */
const runTimeoutMs = 120_000;

/** The SSH connection the task signs in with. Set up over the API: it is not under test. */
const connectionName = 'e2e-rsync-loopback';

/** What the task sends, and where it sends it. */
const sourceLeaf = 'e2e_rsync_run_src';
const targetLeaf = 'e2e_rsync_run_dst';
const description = 'E2E rsync run';

/** A Module-mode task beside it, which must not run. */
const bystanderLeaf = 'e2e_rsync_run_bystander';
const bystanderModule = 'e2e-run-bystander';
const bystanderDescription = 'E2E rsync run bystander';

const allLeaves = [sourceLeaf, targetLeaf, bystanderLeaf];

/** What a run copies. Written fresh for each test. */
const seededFile = 'e2e-rsync.txt';

/** The first of every month, so no scheduled run lands while the spec is running. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

let connectionId: number;

/**
 * The connection, root's key and SSH are set up once for the file: none of them
 * is under test. Tasks go first because middleware will not delete a connection
 * a task uses, so a run interrupted mid-file leaves the next one able to start.
 */
test.beforeAll(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
  }
  connectionId = await ensureLoopbackSshConnectionPresent(api, connectionName);
});

/**
 * Tasks first, then their datasets, so nothing is left pointing at a path that
 * is gone. The datasets are made fresh, so the target holds nothing until a run
 * copies something into it.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the rsync tasks on and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the rsync tasks on "${datasetMountPath(dataset)}"`,
      () => ensureRsyncTasksAbsent(api, datasetMountPath(dataset)),
    ]),
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

/** Separate steps, so a connection that will not delete still has root's key taken back out. */
test.afterAll(async ({ api, pool }) => {
  if (leavingTestData(`the SSH connection "${connectionName}", its keypair and root's key`)) {
    return;
  }

  const paths = allLeaves.map((leaf) => datasetMountPath(`${pool}/${leaf}`));
  await runCleanupSteps([
    ...paths.map((path): [string, () => Promise<void>] => [
      `remove the rsync tasks on "${path}"`, () => ensureRsyncTasksAbsent(api, path),
    ]),
    [`remove the SSH connection "${connectionName}"`, () => ensureSshConnectionAbsent(api, connectionName)],
    ['remove root\'s loopback key, its keypair, and SSH if it was started', () => (
      ensureLoopbackSshAccessAbsent(api, connectionName)
    )],
  ]);
});

test('running a rsync task from the card copies its files to the target path', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const target = datasetMountPath(`${pool}/${targetLeaf}`);
  const bystander = datasetMountPath(`${pool}/${bystanderLeaf}`);
  // No trailing slash on the source, so rsync copies the directory itself into the target.
  const copied = `${target}/${sourceLeaf}`;

  // The card lists four tasks before its pager, and the pager leaves for the full list.
  const existing = await countRsyncTasks(api);
  expect(
    existing + 2 <= rsyncTaskCardPageSize,
    `the card lists ${rsyncTaskCardPageSize} tasks, this test adds 2, the appliance has ${existing}`,
  ).toBe(true);

  await writeFileOnAppliance(api, source, seededFile);
  await ensureRsyncSshTaskPresent(api, {
    path: source,
    connectionId,
    remotePath: target,
    description,
    schedule: monthly,
  });
  await ensureRsyncTaskPresent(api, {
    path: bystander,
    remoteModule: bystanderModule,
    description: bystanderDescription,
    schedule: monthly,
  });
  const task = await findRsyncTask(api, source);
  const bystanderTask = await findRsyncTask(api, bystander);
  // Without both ids, the run reads below would match no job and pass for nothing.
  if (!task || !bystanderTask) {
    throw new Error(`rsynctask.query has no task on "${source}" or on "${bystander}" after creating both.`);
  }
  const earlierRuns = await findRsyncRunJobIds(api);
  // Nothing has been copied yet, so the directory existing afterwards is the run's.
  expect(await directoryExists(api, copied)).toBe(false);

  await runRsyncTaskFromCard(page, source, rsyncRemoteHost);

  await expect.poll(
    async () => (await findRsyncRuns(api, task.id, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findFileNames(api, copied)).toEqual([seededFile]);
  await expect(page.locator(rsyncTaskLocators.card.state(source, rsyncRemoteHost))).toHaveText('Completed');

  // The whole point of the second task: the card looks the same either way.
  await expect(page.locator(rsyncTaskLocators.card.row(bystander, rsyncRemoteHost))).toBeVisible();
  expect(await findRsyncRuns(api, bystanderTask.id, earlierRuns)).toEqual([]);
});
