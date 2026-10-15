/**
 * Story: an admin reads a rsync task's last run from its State on the Data
 * Protection card, and clicks the state to read that run's log — the reason it
 * failed, or what it copied.
 *
 * Every Data Protection card renders its State through the same
 * `ix-task-state-cell`, so rsync stands for all of them. It is the one where both
 * outcomes need no outside service: a Module-mode task against `127.0.0.1` fails,
 * because no rsync daemon listens there, and an SSH-mode task through a
 * connection back to the appliance succeeds — see `fixtures/ssh-connections.ts`.
 *
 * The runs are started over the API. Starting one is "Run job", which
 * `rsync-task-run.e2e.ts` covers, and on the card it also raises its own error
 * dialog when the run fails — which would stand in for the one under test here.
 *
 * What the screen shows is checked against the job itself, read from
 * `core.get_jobs`: its state for the State, and its `logs_excerpt` for the log.
 */
import { writeFileOnAppliance } from '../fixtures/cloud-sync';
import {
  countRsyncTasks,
  ensureRsyncSshTaskPresent,
  ensureRsyncTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncRunJobIds,
  findRsyncRuns,
  findRsyncTask,
  rsyncRemoteHost,
  type RsyncTaskRecord,
  type RsyncTaskSchedule,
  startRsyncRun,
} from '../fixtures/rsync-tasks';
import {
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
} from '../fixtures/ssh-connections';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToDataProtection } from '../flows/navigation';
import { rsyncTaskCardPageSize } from '../flows/rsync-tasks';
import { errorDialogLocators, showLogsDialogLocators } from '../locators/dialogs';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

/** A refused connection fails at once and a one-file push is seconds; this is room for a slow appliance. */
const runTimeoutMs = 120_000;

/** The SSH connection the succeeding task signs in with. Set up over the API: it is not under test. */
const connectionName = 'e2e-rsync-state-loopback';

/** The task that fails: Module mode, against a host with no rsync daemon. */
const failingLeaf = 'e2e_rsync_state_fail';
const failingModule = 'e2e-state-fail';

/** The task that succeeds, and where it copies to. */
const sourceLeaf = 'e2e_rsync_state_src';
const targetLeaf = 'e2e_rsync_state_dst';

const allLeaves = [failingLeaf, sourceLeaf, targetLeaf];

/** What the succeeding run copies, and so what its log names. */
const seededFile = 'e2e-rsync-state.txt';

/** The first of every month, so no scheduled run lands while the spec is running. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

let connectionId: number;

/** Tasks go first because middleware will not delete a connection a task uses. */
test.beforeAll(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
  }
  connectionId = await ensureLoopbackSshConnectionPresent(api, connectionName);
});

/** Tasks first, then their datasets, so nothing is left pointing at a path that is gone. */
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

/** The card lists four tasks before its pager, and the pager leaves for the full list. */
async function expectRoomOnCard(api: E2eApiClient): Promise<void> {
  const existing = await countRsyncTasks(api);
  expect(
    existing + 1 <= rsyncTaskCardPageSize,
    `the card lists ${rsyncTaskCardPageSize} tasks, this test adds 1, the appliance has ${existing}`,
  ).toBe(true);
}

/** The task on this path, or a failure saying it is missing — without an id, every run read would match nothing. */
async function requireRsyncTask(api: E2eApiClient, path: string): Promise<RsyncTaskRecord> {
  const task = await findRsyncTask(api, path);
  if (!task) {
    throw new Error(`rsynctask.query has no task on "${path}" after creating it.`);
  }
  return task;
}

/** Starts a run over the API, waits for it to end in `state`, and returns the log middleware kept for it. */
async function runToState(api: E2eApiClient, taskId: number, state: string): Promise<string> {
  const earlierRuns = await findRsyncRunJobIds(api);
  await startRsyncRun(api, taskId);

  await expect.poll(
    async () => (await findRsyncRuns(api, taskId, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual([state]);

  const [run] = await findRsyncRuns(api, taskId, earlierRuns);
  return run?.logs ?? '';
}

test('a rsync task whose run failed shows Failed, and its state opens the log saying why', async ({
  page, api, pool,
}) => {
  const path = datasetMountPath(`${pool}/${failingLeaf}`);
  await expectRoomOnCard(api);

  await ensureRsyncTaskPresent(api, {
    path,
    remoteModule: failingModule,
    description: 'E2E rsync state failed',
    schedule: monthly,
  });
  const task = await requireRsyncTask(api, path);

  const logs = await runToState(api, task.id, 'FAILED');
  // The reason, as the appliance recorded it: rsync could not reach a daemon.
  expect(logs).toMatch(/connection refused/i);

  await goToDataProtection(page);
  const state = page.locator(rsyncTaskLocators.card.state(path, rsyncRemoteHost));
  await expect(state).toHaveText('Failed');
  await state.click();

  await expect(page.locator(errorDialogLocators.title)).toBeVisible();
  await page.locator(errorDialogLocators.viewDetails).click();
  await page.locator(errorDialogLocators.showLogsExcerpt).click();
  await expect(page.locator(errorDialogLocators.logsExcerpt)).toContainText(/connection refused/i);

  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
});

test('a rsync task whose run succeeded shows Completed, and its state opens the log of what it copied', async ({
  page, api, pool,
}) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const target = datasetMountPath(`${pool}/${targetLeaf}`);
  await expectRoomOnCard(api);

  await writeFileOnAppliance(api, source, seededFile);
  await ensureRsyncSshTaskPresent(api, {
    path: source,
    connectionId,
    remotePath: target,
    description: 'E2E rsync state succeeded',
    schedule: monthly,
    extra: ['--verbose'],
  });
  const task = await requireRsyncTask(api, source);

  const logs = await runToState(api, task.id, 'SUCCESS');
  // `--verbose` lists every file sent, so the log names the one this run copied.
  expect(logs).toContain(seededFile);

  await goToDataProtection(page);
  const state = page.locator(rsyncTaskLocators.card.state(source, rsyncRemoteHost));
  await expect(state).toHaveText('Completed');
  await state.click();

  // The logs dialog, not the error one: a run that worked has no error to report.
  await expect(page.locator(showLogsDialogLocators.title)).toBeVisible();
  await expect(page.locator(showLogsDialogLocators.logs)).toContainText(seededFile);
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  await page.locator(showLogsDialogLocators.close).click();
  await expect(page.locator(showLogsDialogLocators.title)).toBeHidden();
});
