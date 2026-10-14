/**
 * Story: with the topbar's jobs panel open, a job that starts on the appliance
 * appears among the running jobs, and when it completes it moves to the
 * recently finished ones.
 *
 * The panel is the subject, not whatever starts the job, so the job is started
 * over the API: a run of a cron job whose command is a short `sleep`, long
 * enough for the panel to show it running. The panel learns of it the way it
 * learns of any job another session started, from the `core.get_jobs` events
 * the app subscribes to.
 *
 * Its completion is asserted twice: the panel moves the job's row from one list
 * to the other, and `core.get_jobs` says it ended in SUCCESS. The finished list
 * holds failed jobs too, so the row alone would not say which.
 */
import {
  ensureCronjobAbsent,
  ensureCronjobPresent,
  findCronjob,
  findCronRuns,
  startCronRun,
  type CronSchedule,
} from '../fixtures/cron';
import { openJobsPanel } from '../flows/topbar-panels';
import { jobsPanelLocators } from '../locators/jobs-panel';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Long enough to be seen running, and harmless if a schedule ever fires it. */
const command = 'sleep 20';
const description = 'Watched from the jobs panel';

/** The first of every month, so the cron job never fires on its own during a run. */
const monthly: CronSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** From the call returning to the job's row rendering: one socket event. */
const jobAppearsTimeoutMs = 15_000;

/** The sleep, plus middleware finishing the job and the event reaching the panel. */
const jobFinishesTimeoutMs = 60_000;

test.beforeEach(async ({ api }) => {
  await ensureCronjobAbsent(api, command);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the cron job running "${command}"`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the cron job running "${command}"`, () => ensureCronjobAbsent(api, command)],
  ]);
});

test('a job shows in the jobs panel while it runs, then among the finished jobs', async ({ page, api }) => {
  await ensureCronjobPresent(api, { command, description, schedule: monthly });
  const cronjob = await findCronjob(api, command);
  if (!cronjob) {
    throw new Error(`the cron job running "${command}" seeded over the API is not there to run`);
  }

  const { ongoingJob, finishedJob, progress } = jobsPanelLocators;
  await openJobsPanel(page);

  const jobId = await startCronRun(api, cronjob.id);

  await expect(page.locator(ongoingJob(jobId))).toBeVisible({ timeout: jobAppearsTimeoutMs });
  await expect(page.locator(progress(jobId))).toBeVisible({ timeout: jobAppearsTimeoutMs });

  await expect(page.locator(finishedJob(jobId))).toBeVisible({ timeout: jobFinishesTimeoutMs });
  await expect(page.locator(ongoingJob(jobId))).toBeHidden();
  await expect(page.locator(progress(jobId))).toBeHidden();

  const run = (await findCronRuns(api, cronjob.id)).find((candidate) => candidate.id === jobId);
  expect(run?.state).toBe('SUCCESS');
});
