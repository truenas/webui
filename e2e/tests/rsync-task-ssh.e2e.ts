/**
 * Stories: an admin saves a rsync task in SSH mode from the card on Data
 * Protection, the task keeps its connection settings when it is edited, and a
 * task in the Pull direction copies files from the remote path into the local
 * dataset.
 *
 * The "remote" is the appliance itself, through an SSH connection to
 * `127.0.0.1` made with `fixtures/ssh-connections.ts` under this spec's own
 * name — see `rsync-task-run.e2e.ts`, which pushes the same way. Middleware runs
 * rsync over `ssh` exactly as it would to another host.
 *
 * Every save in SSH mode is checked by middleware before it is stored: Validate
 * Remote Path is ticked by default, so the form's save signs in over the
 * connection and lists the remote path. Each remote path here is a dataset that
 * exists, so that check has something to find.
 *
 * Module mode, Push and the transfer options are `rsync-tasks.e2e.ts`; running a
 * push is `rsync-task-run.e2e.ts`.
 */
import { findFileNames, writeFileOnAppliance } from '../fixtures/cloud-sync';
import {
  countRsyncTasks,
  ensureRsyncSshTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncRunJobIds,
  findRsyncRuns,
  findRsyncTask,
  findRsyncTasks,
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
import {
  chooseRsyncTaskDirection,
  chooseRsyncTaskSchedule,
  chooseRsyncTaskUser,
  connectRsyncTaskOverSsh,
  fillRsyncTaskPath,
  openAddRsyncTaskForm,
  openEditRsyncTaskForm,
  rsyncTaskCardPageSize,
  runRsyncTaskFromCard,
  saveRsyncTaskForm,
} from '../flows/rsync-tasks';
import { hourlyScheduleLabel } from '../locators/cron';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A pull of one small file over loopback SSH is seconds; this is room for a slow appliance. */
const runTimeoutMs = 120_000;

/** The SSH connection every task signs in with. Set up over the API: it is not under test. */
const connectionName = 'e2e-rsync-ssh-mode';

const user = 'root';

/** The local side of every task here. */
const localLeaf = 'e2e_rsync_ssh_local';
/** The remote side: a path on the appliance, reached over the connection. */
const remoteLeaf = 'e2e_rsync_ssh_remote';
/** The local side of the task the edit test changes, provisioned over the API. */
const targetLeaf = 'e2e_rsync_ssh_target';

const allLeaves = [localLeaf, remoteLeaf, targetLeaf];

const targetDescription = 'E2E rsync SSH target';
const editedDescription = 'E2E rsync SSH edited';

/** What a pull copies. Written fresh for each test that needs it. */
const seededFile = 'e2e-rsync-pull.txt';

/** The first of every month, so no scheduled run lands while the spec is running. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: RsyncTaskSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

let connectionId: number;

/**
 * Fails up front when the card cannot show the row a test needs.
 *
 * The card lists four tasks before its pager, and the pager leaves for the full
 * list rather than expanding — see `rsyncTaskCardPageSize`.
 */
async function requireRoomOnCard(api: E2eApiClient): Promise<void> {
  const existing = await countRsyncTasks(api);
  expect(
    existing + 1 <= rsyncTaskCardPageSize,
    `the card lists ${rsyncTaskCardPageSize} tasks, this test adds 1, the appliance has ${existing}`,
  ).toBe(true);
}

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
 * is gone. The datasets are made fresh, so the local side holds nothing until a
 * run copies something into it.
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

test('an admin adds a rsync task in SSH mode, and the appliance keeps its connection', async ({ page, api, pool }) => {
  const local = datasetMountPath(`${pool}/${localLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  const description = 'E2E rsync SSH created';
  await requireRoomOnCard(api);

  const { form, card } = rsyncTaskLocators;
  await openAddRsyncTaskForm(page);
  await fillRsyncTaskPath(page, local);
  await chooseRsyncTaskUser(page, user);
  await chooseRsyncTaskDirection(page, 'Pull');
  await page.locator(form.description).fill(description);
  await connectRsyncTaskOverSsh(page, { connection: connectionName, remotePath: remote });
  // The form starts with no schedule and will not save without one.
  await chooseRsyncTaskSchedule(page, hourlyScheduleLabel);
  await saveRsyncTaskForm(page);

  // Through a keychain connection the form sends no host, so the row is tagged `-null`.
  await expect(page.locator(card.path(local, null))).toHaveText(local);

  expect(await findRsyncTasks(api, local)).toHaveLength(1);
  expect(await findRsyncTask(api, local)).toMatchObject({
    path: local,
    user,
    direction: 'PULL',
    desc: description,
    mode: 'SSH',
    ssh_credentials: { id: connectionId },
    remotehost: null,
    remotepath: remote,
    schedule: hourly,
    enabled: true,
  });
});

test('editing a rsync task in SSH mode keeps its connection settings', async ({ page, api, pool }) => {
  const target = datasetMountPath(`${pool}/${targetLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  await requireRoomOnCard(api);
  await ensureRsyncSshTaskPresent(api, {
    path: target,
    connectionId,
    remotePath: remote,
    description: targetDescription,
    schedule: monthly,
  });
  const before = await findRsyncTask(api, target);

  // Only the description changes. The form has to load the mode, the connection
  // and the remote path back in from the task, or saving sends something else.
  const { form, card } = rsyncTaskLocators;
  await openEditRsyncTaskForm(page, { path: target, remoteHost: rsyncRemoteHost, description: targetDescription });
  await page.locator(form.description).fill(editedDescription);
  await saveRsyncTaskForm(page);

  // The task was provisioned with a host, which the form clears in keychain
  // mode, so the row is renamed to `-null` — see `locators/rsync-tasks.ts`.
  await expect(page.locator(card.path(target, null))).toHaveText(target);

  // The same record, by id, and still the only one on the path.
  expect(await findRsyncTasks(api, target)).toHaveLength(1);
  expect(await findRsyncTask(api, target)).toMatchObject({
    id: before?.id,
    desc: editedDescription,
    mode: 'SSH',
    ssh_credentials: { id: connectionId },
    remotepath: remote,
    direction: 'PUSH',
    schedule: monthly,
    enabled: true,
  });
});

test('running a Pull task copies the remote path into the local dataset', async ({ page, api, pool }) => {
  const local = datasetMountPath(`${pool}/${localLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  // No trailing slash on the remote path, so rsync copies the directory itself into the local path.
  const copied = `${local}/${remoteLeaf}`;
  await requireRoomOnCard(api);

  await writeFileOnAppliance(api, remote, seededFile);
  await ensureRsyncSshTaskPresent(api, {
    path: local,
    connectionId,
    remotePath: remote,
    description: 'E2E rsync SSH pull',
    schedule: monthly,
    direction: 'PULL',
  });
  const task = await findRsyncTask(api, local);
  // Without the id, the run read below would match no job and pass for nothing.
  if (!task) {
    throw new Error(`rsynctask.query has no task on "${local}" after creating it.`);
  }
  const earlierRuns = await findRsyncRunJobIds(api);
  // Nothing has been copied yet, so the directory existing afterwards is the run's.
  expect(await directoryExists(api, copied)).toBe(false);

  await runRsyncTaskFromCard(page, local, rsyncRemoteHost);

  await expect.poll(
    async () => (await findRsyncRuns(api, task.id, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findFileNames(api, copied)).toEqual([seededFile]);
  // A push of the same task would have written the local directory into the remote path instead.
  expect(await directoryExists(api, `${remote}/${localLeaf}`)).toBe(false);
  await expect(page.locator(rsyncTaskLocators.card.state(local, rsyncRemoteHost))).toHaveText('Completed');
});
