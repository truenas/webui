/**
 * Story: an admin dismisses an alert from the topbar's alerts panel and then
 * reopens it, and the appliance holds what they did.
 *
 * Middleware has no public call that raises an alert, so the spec makes
 * something happen that reports itself as one: an NFS share restricted to as
 * many networks as middleware warns about (see `nfsNetworkListAlertThreshold` in
 * `fixtures/alerts.ts`). Saving it raises a `NFSNetworkListExcessive` warning
 * for its path. Deleting the share deletes the alert, which is the whole of the
 * teardown.
 *
 * The class is chosen for how middleware dismisses it. A dismissed alert of this
 * class is marked dismissed and can be reopened; `RsyncFailed`, which this spec
 * used first, is deleted on dismiss and leaves nothing to reopen.
 *
 * The alert is raised in `beforeEach`, before the test's page exists, so the
 * panel finds it in the `alert.list` the app reads when the bell is pressed. The
 * panel's live updates are not what this covers.
 *
 * Each step is asserted twice: the panel moves the alert between its open and
 * dismissed views, and `alert.list` says whether middleware has it dismissed.
 */
import {
  findNfsNetworkListAlert, listAlerts, nfsNetworkListAlertThreshold, type AlertRecord,
} from '../fixtures/alerts';
import { ensureNfsShareAbsent, ensureNfsSharePresent } from '../fixtures/nfs';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openAlertsPanel } from '../flows/topbar-panels';
import { alertsPanelLocators } from '../locators/alerts-panel';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Exported by the share whose network list raises the alert. */
const leaf = 'e2e_alerts_nfs';

/**
 * Exactly as many networks as raise the alert, distinct and non-overlapping,
 * since middleware rejects a list that repeats or nests one. Documentation
 * address space would be tidier, but there is not a hundred /24s of it.
 */
const networks = Array.from({ length: nfsNetworkListAlertThreshold }, (_, i) => `10.231.${i}.0/24`);

/** Raised while the share's create is validated, so it is there when the call answers. */
const alertRaisedTimeoutMs = 15_000;

/** A dismiss or a re-open is one call per alert, and the store moves it when that answers. */
const alertMoveTimeoutMs = 30_000;

/** Set by `beforeEach`: the alert the test acts on, and the path of the share that raised it. */
let raised: { path: string; alert: AlertRecord } | undefined;

test.beforeEach(async ({ api, pool }) => {
  raised = undefined;
  const path = datasetMountPath(`${pool}/${leaf}`);

  // Removing the share removes any alert an earlier run of this spec left.
  await ensureNfsShareAbsent(api, path);
  await ensureDatasetPresent(api, `${pool}/${leaf}`);
  await ensureNfsSharePresent(api, { path, comment: 'Lists too many networks, to raise an alert', networks });

  await expect.poll(
    () => findNfsNetworkListAlert(api, path),
    { timeout: alertRaisedTimeoutMs, message: `saving the share on "${path}" should raise NFSNetworkListExcessive` },
  ).toBeDefined();

  const alert = await findNfsNetworkListAlert(api, path);
  if (!alert) {
    throw new Error(`the NFSNetworkListExcessive alert for "${path}" went away as soon as it appeared`);
  }
  expect(alert.dismissed).toBe(false);

  // Every id on the panel's entry is built from the key alone, and this class
  // has no key of its own, so any other alert keyed the same way shares it and
  // every locator would match twice.
  const sharingKey = (await listAlerts(api)).filter((other) => other.key === alert.key && other.id !== alert.id);
  expect(sharingKey.map((other) => other.klass), `no other alert may share the key ${alert.key}`).toEqual([]);

  raised = { path, alert };
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${leaf}`;
  if (leavingTestData(`the NFS share on ${dataset}, its NFSNetworkListExcessive alert and the dataset itself`)) {
    return;
  }

  // The share first: deleting it is what deletes the alert, and it exports the dataset.
  const path = datasetMountPath(dataset);
  await runCleanupSteps([
    [`remove the NFS shares on "${path}"`, () => ensureNfsShareAbsent(api, path)],
    [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('an admin dismisses an alert from the alerts panel, then reopens it', async ({ page, api }) => {
  if (!raised) {
    throw new Error('beforeEach raised no alert to act on');
  }
  const { path, alert } = raised;
  const {
    level, dismiss, reopen, filterAll, filterDismissed,
  } = alertsPanelLocators;

  await openAlertsPanel(page);
  await expect(page.locator(level(alert.key))).toBeVisible();

  await page.locator(dismiss(alert.key)).click();

  // Visible a moment ago, so its going is the dismissal and not a missed render.
  await expect(page.locator(level(alert.key))).toBeHidden({ timeout: alertMoveTimeoutMs });
  await expect.poll(
    async () => (await findNfsNetworkListAlert(api, path))?.dismissed,
    { timeout: alertMoveTimeoutMs, message: 'middleware should hold the alert as dismissed' },
  ).toBe(true);

  await page.locator(filterDismissed).click();
  await page.locator(reopen(alert.key)).click();

  await expect(page.locator(reopen(alert.key))).toBeHidden({ timeout: alertMoveTimeoutMs });
  await expect.poll(
    async () => (await findNfsNetworkListAlert(api, path))?.dismissed,
    { timeout: alertMoveTimeoutMs, message: 'middleware should hold the alert as open again' },
  ).toBe(false);

  // Back among the open alerts, where only an undismissed alert shows its level.
  await page.locator(filterAll).click();
  await expect(page.locator(level(alert.key))).toBeVisible();
  await expect(page.locator(dismiss(alert.key))).toBeVisible();
});
