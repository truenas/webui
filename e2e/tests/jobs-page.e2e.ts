/**
 * Story: an admin opens the Jobs page from the topbar's jobs panel, filters it
 * by state, downloads a failed job's log from its error, and follows a failed
 * job's "View Details" to that job on the page, already expanded.
 *
 * The page lists every job on the appliance, so every assertion is scoped to the
 * seeded jobs by id. The jobs are runs of cron jobs, started over the API as
 * `jobs-panel.e2e.ts` does: the page is the subject, not whatever starts a job.
 * What the page shows is checked against `core.get_jobs`.
 *
 * Read from middleware's `plugins/cron/execute.py`:
 * - a run whose command exits non-zero ends FAILED, with an `error` naming the
 *   exit status;
 * - the command's output is streamed into the job log as it runs, which is what
 *   the error dialog's Download Logs needs: it renders only for a job with a log
 *   excerpt. The fixture's `stdout: true` hides output by appending
 *   `> /dev/null` to the command line, and here that redirects only the `false`
 *   after the `;`, so the `echo` reaches the log;
 * - `cronjob.run` is not abortable, so the running `sleep` cannot be stopped in
 *   teardown and ends on its own. Its cron job is still removed.
 *
 * Expanding a row from its chevron (the ticket's second scenario) waits on a
 * row-scoped id for that chevron, #14687, and is not here yet.
 */
import { readFile } from 'node:fs/promises';
import {
  ensureCronjobAbsent,
  ensureCronjobPresent,
  findCronjob,
  findCronRuns,
  startCronRun,
  type CronSchedule,
} from '../fixtures/cron';
import { openJobsPage, openJobsPanel } from '../flows/topbar-panels';
import { errorDialogLocators } from '../locators/dialogs';
import { jobsPageLocators } from '../locators/jobs';
import { jobsPanelLocators } from '../locators/jobs-panel';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What the failing run prints before it fails, and so what its log holds. */
const failedOutput = 'e2e-jobs-page-failed';

const succeeding = { command: 'echo e2e-jobs-page-ok', description: 'E2E jobs page succeeds' };
const failing = { command: `echo ${failedOutput}; false`, description: 'E2E jobs page fails' };
/** Long enough to still be running when the Active filter is checked, short enough to end soon after. */
const sleeping = { command: 'sleep 60', description: 'E2E jobs page runs' };

const allCommands = [succeeding.command, failing.command, sleeping.command];

/** The first of every month, so no cron job fires on its own during a run. */
const monthly: CronSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** An `echo` is instant; this is room for a slow appliance to start and finish the job. */
const runTimeoutMs = 60_000;

/** `core.job_download_logs`, then fetching the file it returns. */
const downloadTimeoutMs = 30_000;

/** A seeded run as `core.get_jobs` reports it, with the cron job it is a run of. */
type CronRun = Awaited<ReturnType<typeof findCronRuns>>[number] & { cronjobId: number };

/** The run's state in `core.get_jobs` now, or undefined if middleware no longer has it. */
async function readRunState(api: E2eApiClient, { cronjobId, id }: CronRun): Promise<string | undefined> {
  return (await findCronRuns(api, cronjobId)).find((run) => run.id === id)?.state;
}

test.beforeEach(async ({ api }) => {
  for (const command of allCommands) {
    await ensureCronjobAbsent(api, command);
  }
});

test.afterEach(async ({ api }) => {
  const quotedCommands = allCommands.map((command) => JSON.stringify(command)).join(', ');
  if (leavingTestData(`the cron jobs running ${quotedCommands}`)) {
    return;
  }

  await runCleanupSteps(allCommands.map((command): [string, () => Promise<void>] => [
    `remove the cron job running "${command}"`, () => ensureCronjobAbsent(api, command),
  ]));
});

/**
 * Seeds a cron job, starts one run of it over the API, and waits until
 * `core.get_jobs` has that run in `state`. Not `runJob`, which throws on FAILED.
 */
async function runToState(
  api: E2eApiClient,
  { command, description }: { command: string; description: string },
  state: string,
): Promise<CronRun> {
  await ensureCronjobPresent(api, { command, description, schedule: monthly });
  const cronjob = await findCronjob(api, command);
  if (!cronjob) {
    throw new Error(`the cron job running "${command}" seeded over the API is not there to run`);
  }

  const jobId = await startCronRun(api, cronjob.id);
  const readRun = async (): Promise<CronRun | undefined> => {
    const run = (await findCronRuns(api, cronjob.id)).find((candidate) => candidate.id === jobId);
    return run && { ...run, cronjobId: cronjob.id };
  };

  await expect.poll(async () => (await readRun())?.state, { timeout: runTimeoutMs }).toBe(state);

  const run = await readRun();
  if (!run) {
    throw new Error(`core.get_jobs has no job ${jobId} for "${command}" after it reached ${state}`);
  }
  return run;
}

/** The failing run, and a failure saying so if its output never reached the log Download Logs depends on. */
async function runToFailure(api: E2eApiClient): Promise<CronRun> {
  const run = await runToState(api, failing, 'FAILED');
  expect(run.logs, `the log excerpt of failed job ${run.id}`).toContain(failedOutput);
  return run;
}

test('an admin opens the Jobs page from the jobs panel and filters jobs by state', async ({ page, api }) => {
  const succeeded = await runToState(api, succeeding, 'SUCCESS');
  const failed = await runToState(api, failing, 'FAILED');
  const running = await runToState(api, sleeping, 'RUNNING');
  const seeded = [succeeded, failed, running];

  await openJobsPage(page);
  const { filter, row, state } = jobsPageLocators;

  await expect(page.locator(filter.all)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(state(succeeded.id))).toHaveText('Completed');
  await expect(page.locator(state(failed.id))).toHaveText('Failed');
  await expect(page.locator(state(running.id))).toHaveText('Running');

  // Read while the sleep is still running, so the states are the ones the cells just showed.
  const states = await Promise.all(seeded.map((run) => readRunState(api, run)));
  expect(states).toEqual(['SUCCESS', 'FAILED', 'RUNNING']);

  await page.locator(filter.failed).click();
  await expect(page.locator(filter.failed)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(row(failed.id))).toBeVisible();
  await expect(page.locator(row(succeeded.id))).toHaveCount(0);
  await expect(page.locator(row(running.id))).toHaveCount(0);

  await page.locator(filter.active).click();
  await expect(page.locator(filter.active)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(row(running.id))).toBeVisible();
  await expect(page.locator(row(succeeded.id))).toHaveCount(0);
  await expect(page.locator(row(failed.id))).toHaveCount(0);

  await page.locator(filter.all).click();
  await expect(page.locator(filter.all)).toHaveAttribute('aria-pressed', 'true');
  for (const { id } of seeded) {
    await expect(page.locator(row(id))).toBeVisible();
  }
});

test('Download Logs on a failed job saves its log', async ({ page, api }) => {
  const failed = await runToFailure(api);

  await openJobsPage(page);
  await page.locator(jobsPageLocators.filter.failed).click();
  await page.locator(jobsPageLocators.state(failed.id)).click();
  await expect(page.locator(errorDialogLocators.title)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: downloadTimeoutMs }),
    page.locator(errorDialogLocators.downloadLogs).click(),
  ]);

  expect(download.suggestedFilename()).toBe(`${failed.id}.log`);
  expect(await readFile(await download.path(), 'utf8')).toContain(failedOutput);
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
});

test('View Details on a failed job\'s error opens that job on the Jobs page, already expanded', async ({
  page, api,
}) => {
  const failed = await runToFailure(api);

  await openJobsPanel(page);
  await page.locator(jobsPanelLocators.finishedJob(failed.id)).click();
  await expect(page.locator(jobsPanelLocators.runningCount)).toBeHidden();
  await expect(page.locator(errorDialogLocators.title)).toBeVisible();

  await page.locator(errorDialogLocators.viewJobDetails).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  await expect(page).toHaveURL(new RegExp(`/jobs\\?jobId=${failed.id}$`));
  // Open on arrival: nothing on the page was clicked.
  await expect(page.locator(jobsPageLocators.detail.id(failed.id))).toHaveText(String(failed.id));
  await expect(page.locator(jobsPageLocators.detail.logExcerpt(failed.id))).toContainText(failedOutput);
});
