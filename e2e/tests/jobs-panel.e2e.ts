/**
 * Story: with the jobs panel open, a job started on the appliance appears among the running jobs and moves to the
 * finished ones when done. It is a cron job run with a short `sleep`, started over the API, which the panel learns
 * of from `core.get_jobs` events. Completion is checked in the panel and through `core.get_jobs` (SUCCESS), since
 * the finished list holds failed jobs too.
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
