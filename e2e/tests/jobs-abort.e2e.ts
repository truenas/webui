/**
 * Stories: an admin aborts a running job from the topbar's jobs panel, or from the job progress
 * dialog the panel opens on it, and cancelling the panel's confirm leaves the job running.
 *
 * Both Aborts call `core.job_abort`. The panel's reducer marks the job ABORTED as soon as that call
 * answers, without waiting for middleware's event, so the panel changing proves only that the call
 * returned. `core.get_jobs` is what says the job really ended ABORTED. The page's own calls are
 * recorded too, so the cancel test can show that no abort was sent rather than only that the job
 * has not ended yet.
 *
 * The job is a `cloudsync.sync` run, started over the API: the panel is the subject, not the task.
 * `cronjob.run` would be cheaper, as in `jobs-panel.e2e.ts`, but middleware does not declare it
 * `abortable`, and the panel offers Abort only on a job that is. `cloudsync.sync` is, and given a
 * bandwidth limit and a large file over the loopback SFTP credential it runs for minutes, which is
 * the setup `cloud-sync-tasks.e2e.ts` uses for its own Stop test. Each test reads `abortable` off
 * the job it started before relying on it. Each test starts its own run.
 *
 * An aborted job leaves the panel altogether. The running list holds running and waiting jobs, and
 * "Recently Completed Jobs" holds succeeded and failed ones only.
 */
import {
  type CloudSyncBandwidthLimit,
  type CloudSyncSchedule,
  cloudSyncRunTimeoutMs,
  ensureCloudSyncTaskPresent,
  ensureCloudSyncTasksAbsent,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncTask,
  loopbackCredentialName,
  startCloudSyncRun,
  writeFileOnAppliance,
} from '../fixtures/cloud-sync';
import {
  ensureJobEnded,
  jobEndTimeoutMs,
  readJob,
  type JobReading,
} from '../fixtures/jobs';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openJobsPanel } from '../flows/topbar-panels';
import { confirmDialogLocators, errorDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import { jobsPanelLocators } from '../locators/jobs-panel';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

const taskDescription = 'E2E job abort';

/** The directory the task sends, and the folder on the loopback remote it sends to. */
const sourceLeaf = 'e2e_jobabort_src';
const remoteLeaf = 'e2e_jobabort_remote';
const leaves = [sourceLeaf, remoteLeaf];

/** 32 MiB at 64 KiB a second is over eight minutes, so the run is still going whatever a test does. */
const largeFile = 'e2e-jobabort-large.bin';
const largeFileBytes = 32 * 1024 * 1024;
const slowLimit: CloudSyncBandwidthLimit[] = [{ time: '00:00', bandwidth: 64 * 1024 }];

/** The first of every month, so the task never runs on its own during a test. */
const monthly: CloudSyncSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** From the job turning RUNNING to its row and Abort rendering: one socket event. */
const jobAppearsTimeoutMs = 15_000;

let credentialId: number;

/** Every run a test started, so teardown can end it before removing the task it belongs to. */
let startedJobIds: number[] = [];

/**
 * Seeds the slow task, starts a run of it over the API and waits for middleware to report the run
 * RUNNING. The panel must already be open: it hears of a job only once its jobs have loaded.
 */
async function startSlowRun(api: E2eApiClient, pool: string): Promise<{ id: number; job: JobReading }> {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  await writeFileOnAppliance(api, source, largeFile, largeFileBytes);
  await ensureCloudSyncTaskPresent(api, {
    description: taskDescription,
    credentialId,
    path: source,
    remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
    schedule: monthly,
    bwlimit: slowLimit,
  });
  const task = await findCloudSyncTask(api, taskDescription);
  if (!task) {
    throw new Error(`the cloud sync task "${taskDescription}" seeded over the API is not there to run`);
  }

  const id = await startCloudSyncRun(api, task.id);
  startedJobIds.push(id);

  await expect.poll(
    async () => (await readJob(api, id))?.state,
    { message: `cloud sync run ${id} should be running`, timeout: cloudSyncRunTimeoutMs },
  ).toBe('RUNNING');
  const job = await readJob(api, id);
  if (!job) {
    throw new Error(`middleware has no record of cloud sync run ${id}`);
  }
  // Whether a job can be aborted is middleware's choice, and Abort renders only if it can.
  expect(job.abortable, `${job.method} should be abortable, or nothing here offers Abort`).toBe(true);

  return { id, job };
}

/**
 * Runs first, then the task, then its datasets, so nothing is left running against a path that is
 * gone. Before each test as well as after it, so a test starts from empty directories.
 */
function cleanupSteps(api: E2eApiClient, pool: string): CleanupStep[] {
  const datasets = leaves.map((leaf) => `${pool}/${leaf}`);
  const jobIds = startedJobIds;

  return [
    ...jobIds.map((jobId): CleanupStep => [`end cloud sync run ${jobId}`, () => ensureJobEnded(api, jobId)]),
    [`remove the cloud sync tasks "${taskDescription}"`, () => ensureCloudSyncTasksAbsent(api, taskDescription)],
    ...datasets.map((dataset): CleanupStep => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ];
}

/** The credential is set up once for the file. It is not under test. */
test.beforeAll(async ({ api }) => {
  await ensureCloudSyncTasksAbsent(api, taskDescription);
  credentialId = await ensureLoopbackSftpCredentialPresent(api);
});

test.beforeEach(async ({ api, pool }) => {
  await runCleanupSteps(cleanupSteps(api, pool));
  startedJobIds = [];
  for (const leaf of leaves) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`cloud sync runs ${startedJobIds.join(', ')}, the task "${taskDescription}" and its datasets`)) {
    return;
  }

  await runCleanupSteps(cleanupSteps(api, pool));
  startedJobIds = [];
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`the SFTP credential "${loopbackCredentialName}", its keypair and root's key`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the cloud sync tasks "${taskDescription}"`, () => ensureCloudSyncTasksAbsent(api, taskDescription)],
    ['remove the loopback SFTP credential', () => ensureLoopbackSftpCredentialAbsent(api)],
  ]);
});

test('an admin aborts a running job from the jobs panel', async ({ page, api, pool }) => {
  await openJobsPanel(page);
  const { id, job } = await startSlowRun(api, pool);
  const abort = page.locator(jobsPanelLocators.abort(job.description, job.method));

  // The starting state the abort has to change.
  await expect(page.locator(jobsPanelLocators.ongoingJob(id))).toBeVisible({ timeout: jobAppearsTimeoutMs });
  await expect(abort).toBeVisible({ timeout: jobAppearsTimeoutMs });

  await abort.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await expect(page.locator(confirmDialogLocators.message)).toContainText(job.method);
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

  // Gone from the panel, which is still open: not running, and not among the finished jobs either.
  await expect(page.locator(jobsPanelLocators.finishedList)).toBeAttached();
  await expect(page.locator(jobsPanelLocators.job(id))).toHaveCount(0);
  expect(apiCallsTo(page, 'core.job_abort').map((call) => call.answer)).toEqual(['result']);

  // The run lasts minutes, so it ends inside this ceiling only if the abort ended it.
  await expect.poll(
    async () => (await readJob(api, id))?.state,
    { message: `cloud sync run ${id} should end aborted`, timeout: jobEndTimeoutMs },
  ).toBe('ABORTED');
});

test('an admin aborts a running job from its progress dialog', async ({ page, api, pool }) => {
  await openJobsPanel(page);
  const { id, job } = await startSlowRun(api, pool);
  const row = page.locator(jobsPanelLocators.ongoingJob(id));
  await expect(row).toBeVisible({ timeout: jobAppearsTimeoutMs });

  await row.click();
  await expect(page.locator(jobsPanelLocators.title)).toBeHidden();
  await expect(page.locator(jobDialogLocators.title)).toContainText(job.description ?? job.method);
  await expect(page.locator(jobDialogLocators.abort)).toBeEnabled();

  // No confirm: the dialog calls `core.job_abort` at once and closes when the job has ended.
  await page.locator(jobDialogLocators.abort).click();
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: jobEndTimeoutMs });

  // The panel handles the dialog's result with the shared error handler, which reports an abort.
  await expect(page.locator(errorDialogLocators.title)).toHaveText('Aborted');
  await expect(page.locator(errorDialogLocators.message)).toContainText('Job aborted');
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  expect(apiCallsTo(page, 'core.job_abort').map((call) => call.answer)).toEqual(['result']);
  await expect.poll(
    async () => (await readJob(api, id))?.state,
    { message: `cloud sync run ${id} should end aborted`, timeout: jobEndTimeoutMs },
  ).toBe('ABORTED');
});

test('cancelling the jobs panel\'s abort confirm leaves the job running', async ({ page, api, pool }) => {
  await openJobsPanel(page);
  const { id, job } = await startSlowRun(api, pool);
  const row = page.locator(jobsPanelLocators.ongoingJob(id));
  const abort = page.locator(jobsPanelLocators.abort(job.description, job.method));
  await expect(row).toBeVisible({ timeout: jobAppearsTimeoutMs });
  await expect(abort).toBeVisible({ timeout: jobAppearsTimeoutMs });

  await abort.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

  await expect(row).toBeVisible();
  await expect(abort).toBeVisible();
  // The job outlasts this test whatever happens, so its state alone could not show an abort was
  // never sent. The page's own calls can.
  expect(apiCallsTo(page, 'core.job_abort')).toEqual([]);
  expect((await readJob(api, id))?.state).toBe('RUNNING');
});
