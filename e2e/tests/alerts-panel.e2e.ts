/**
 * Story: an admin dismisses an alert from the topbar's alerts panel and then
 * reopens it, and the appliance holds what they did.
 *
 * Middleware has no public call that raises an alert, so the spec makes
 * something fail that reports itself as one: a rsync task in Module mode against
 * a host where nothing listens (see `fixtures/rsync-tasks.ts`). Its run fails and
 * raises a critical `RsyncFailed` alert keyed by the task. Deleting the task
 * deletes the alert, which is the whole of the teardown.
 *
 * The alert is raised in `beforeEach`, before the test's page exists, so the
 * panel finds it in what the app loads at sign-in. The panel's live updates are
 * not what this covers.
 *
 * Each step is asserted twice: the panel moves the alert between its open and
 * dismissed views, and `alert.list` says whether middleware has it dismissed.
 */
import {
  findRsyncFailedAlert, findRsyncFailedAlerts, listAlerts, type AlertRecord,
} from '../fixtures/alerts';
import {
  ensureRsyncTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncTask,
  startRsyncTaskRun,
  type RsyncTaskSchedule,
} from '../fixtures/rsync-tasks';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openAlertsPanel } from '../flows/topbar-panels';
import { alertsPanelLocators } from '../locators/alerts-panel';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Synced by the task whose failed run raises the alert. */
const leaf = 'e2e_alerts_rsync';
const remoteModule = 'e2e-alerts';
const description = 'Fails, to raise an alert';

/** The first of every month, so the task never fires on its own during a run. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** The run fails on a refused connection, and middleware raises the alert as it ends. */
const alertRaisedTimeoutMs = 60_000;

/** A dismiss or a re-open is one call per alert, and the store moves it when that answers. */
const alertMoveTimeoutMs = 30_000;

/** Set by `beforeEach`: the alert the test acts on, and the task that raised it. */
let raised: { taskId: number; alert: AlertRecord } | undefined;

test.beforeEach(async ({ api, pool }) => {
  raised = undefined;
  const path = datasetMountPath(`${pool}/${leaf}`);

  // Removing the task removes any alert an earlier run of this spec left.
  await ensureRsyncTasksAbsent(api, path);
  await ensureDatasetPresent(api, `${pool}/${leaf}`);

  // The panel folds every RsyncFailed alert into one entry, which carries the
  // ids of the newest one and dismisses all of them at once. Another task's
  // alert would make that entry stand for more than this test's.
  const others = await findRsyncFailedAlerts(api);
  expect(others, 'no other RsyncFailed alert may be on the appliance: the panel would fold it in')
    .toEqual([]);

  await ensureRsyncTaskPresent(api, {
    path, remoteModule, description, schedule: monthly,
  });
  const task = await findRsyncTask(api, path);
  if (!task) {
    throw new Error(`the rsync task on "${path}" seeded over the API is not there to run`);
  }

  await startRsyncTaskRun(api, task.id);
  await expect.poll(
    () => findRsyncFailedAlert(api, task.id),
    { timeout: alertRaisedTimeoutMs, message: `the failed run of rsync task ${task.id} should raise RsyncFailed` },
  ).toBeDefined();

  const alert = await findRsyncFailedAlert(api, task.id);
  if (!alert) {
    throw new Error(`the RsyncFailed alert for rsync task ${task.id} went away as soon as it appeared`);
  }
  expect(alert.dismissed).toBe(false);

  // Every id on the panel's entry is built from the key alone, and middleware
  // derives a key from an alert's arguments, so another class raised against an
  // object with the same id shares it, and every locator would match twice.
  const sharingKey = (await listAlerts(api)).filter((other) => other.key === alert.key && other.id !== alert.id);
  expect(sharingKey.map((other) => other.klass), `no other alert may share the key ${alert.key}`).toEqual([]);

  raised = { taskId: task.id, alert };
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  if (leavingTestData(`the rsync task on ${dataset}, its RsyncFailed alert and the dataset itself`)) {
    return;
  }

  // The task first: deleting it is what deletes the alert.
  const path = datasetMountPath(dataset);
  await runCleanupSteps([
    [`remove the rsync tasks on "${path}"`, () => ensureRsyncTasksAbsent(api, path)],
    [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('an admin dismisses an alert from the alerts panel, then reopens it', async ({ page, api }) => {
  if (!raised) {
    throw new Error('beforeEach raised no alert to act on');
  }
  const { taskId, alert } = raised;
  const { level, dismiss, reopen, filterAll, filterDismissed } = alertsPanelLocators;

  await openAlertsPanel(page);
  await expect(page.locator(level(alert.key))).toBeVisible();

  await page.locator(dismiss(alert.key)).click();

  // Visible a moment ago, so its going is the dismissal and not a missed render.
  await expect(page.locator(level(alert.key))).toBeHidden({ timeout: alertMoveTimeoutMs });
  await expect.poll(
    async () => (await findRsyncFailedAlert(api, taskId))?.dismissed,
    { timeout: alertMoveTimeoutMs, message: 'middleware should hold the alert as dismissed' },
  ).toBe(true);

  await page.locator(filterDismissed).click();
  await page.locator(reopen(alert.key)).click();

  await expect(page.locator(reopen(alert.key))).toBeHidden({ timeout: alertMoveTimeoutMs });
  await expect.poll(
    async () => (await findRsyncFailedAlert(api, taskId))?.dismissed,
    { timeout: alertMoveTimeoutMs, message: 'middleware should hold the alert as open again' },
  ).toBe(false);

  // Back among the open alerts, where only an undismissed alert shows its level.
  await page.locator(filterAll).click();
  await expect(page.locator(level(alert.key))).toBeVisible();
  await expect(page.locator(dismiss(alert.key))).toBeVisible();
});
