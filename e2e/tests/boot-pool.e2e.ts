/**
 * Stories: an admin scrubs the boot pool; changes how often it is scrubbed, and
 * the dialog refuses an interval under a day; activates another boot environment
 * and then the original again; and attaches an unused disk to the boot pool as a
 * mirror and detaches it again. All from System > Boot and the Boot Pool Status
 * page it links to.
 *
 * Each is asserted twice: the screen, and middleware's own record —
 * `boot.get_state`, `boot.get_disks`, `boot.environment.query`,
 * `system.advanced.config` and `core.get_jobs`.
 *
 * Before each test and after it, unconditionally, the scrub interval is written
 * back as the run found it, and the running boot environment is made the one set
 * to boot next again before the clone is removed — in that order, because a boot
 * environment set to boot next cannot be destroyed.
 *
 * After the attach test, any disk it added to the boot pool is detached and
 * wiped. Not before a test: that needs the boot pool's disks as the test found
 * them, and on a boot pool that is already mirrored there is no telling which
 * disk the appliance was installed on. So the attach test refuses to start on
 * one, and a run killed mid-test leaves the mirror for a person to undo.
 *
 * The original boot disk is never acted on. Replace is out of scope for that
 * reason, and the attach teardown only touches a disk that was not in the boot
 * pool when the test started.
 */
import {
  ensureBootEnvironmentAbsent,
  ensureBootEnvironmentPresent,
  ensureBootPoolDisksOnly,
  ensureRunningBootEnvironmentActivated,
  findBootDevice,
  findBootEnvironment,
  findBootPoolScan,
  findBootPoolTopology,
  findBootScrubJobStateAfter,
  findLatestBootScrubJobId,
  findRunningBootEnvironment,
  listBootDisks,
  readBootScrubInterval,
  setBootScrubInterval,
} from '../fixtures/boot-environments';
import { pickUnusedDisk } from '../fixtures/disks';
import { requireUnusedDisks } from '../fixtures/storage';
import {
  activateBootEnvironment, attachBootDisk, openBootPoolStats, openBootPoolStatus, scrubBootPool,
} from '../flows/boot-environments';
import { goToBootEnvironments } from '../flows/navigation';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const {
  header,
  list,
  statsDialog,
  status,
} = bootEnvironmentLocators;

/** The clone the activate test sets to boot next and back. */
const cloneName = 'e2e-bootenv-activate';

/**
 * What the dialog changes the interval to: 14 days, or 21 on an appliance
 * already at 14, so the change is always a change. Neither is middleware's
 * default of 7.
 */
function changedIntervalFrom(before: number): number {
  return before === 14 ? 21 : 14;
}

/**
 * A scrub of a boot pool holding a few GB. A ceiling on it finishing, not a wait
 * on a schedule.
 */
const bootScrubTimeoutMs = 5 * 60_000;

/** `boot.environment.activate` answers in seconds. The list reloads after it. */
const activateTimeoutMs = 60_000;

/** The scrub interval as the run found it, written back before and after every test. */
let baselineInterval: number | undefined;

/** The boot pool's disks when the attach test started. Unset outside it, so nothing is detached. */
let originalBootDisks: string[] | undefined;

/** The disk the attach test picked, wiped afterwards whether or not it is still attached. */
let attachedDisk: string | undefined;

test.beforeAll(async ({ api }) => {
  baselineInterval = await readBootScrubInterval(api);
});

test.beforeEach(async ({ api }) => {
  originalBootDisks = undefined;
  attachedDisk = undefined;
  if (baselineInterval !== undefined) {
    await setBootScrubInterval(api, baselineInterval);
  }
  await ensureRunningBootEnvironmentActivated(api);
  await ensureBootEnvironmentAbsent(api, cloneName);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the boot environment ${cloneName}, the scrub interval and any disk attached to the boot pool`)) {
    return;
  }

  const disks = originalBootDisks;
  const attached = attachedDisk;
  await runCleanupSteps([
    ['restore the scrub interval', async () => {
      if (baselineInterval !== undefined) {
        await setBootScrubInterval(api, baselineInterval);
      }
    }],
    ['set the running boot environment to boot next', () => ensureRunningBootEnvironmentActivated(api)],
    [`remove the boot environment ${cloneName}`, () => ensureBootEnvironmentAbsent(api, cloneName)],
    ['detach and wipe any disk attached to the boot pool', async () => {
      if (disks) {
        await ensureBootPoolDisksOnly(api, disks, attached);
      }
    }],
  ]);
});

test('an admin scrubs the boot pool, and the scrub runs to the end', async ({ page, api }) => {
  const lastJobId = await findLatestBootScrubJobId(api);
  // Compared by the appliance's own clock, so a runner whose clock differs cannot pass or fail this.
  const previousStart = (await findBootPoolScan(api))?.start_time?.$date ?? 0;

  await scrubBootPool(page);

  // Polled to any end state and then judged, so a failed scrub reports itself
  // in seconds rather than as a timeout.
  await expect.poll(
    () => findBootScrubJobStateAfter(api, lastJobId),
    { message: 'a boot.scrub job newer than the last should finish', timeout: bootScrubTimeoutMs },
  ).toMatch(/^(SUCCESS|FAILED|ABORTED)$/);
  expect(await findBootScrubJobStateAfter(api, lastJobId)).toBe('SUCCESS');

  const scan = await findBootPoolScan(api);
  expect(scan).toMatchObject({ function: 'SCRUB', state: 'FINISHED' });
  expect(scan?.start_time?.$date ?? 0).toBeGreaterThan(previousStart);

  // Opened after the scrub is over: the page reads the scan once, when it loads.
  await openBootPoolStatus(page, await findBootDevice(api));
  await expect(page.locator(status.scanStatus)).toHaveText('FINISHED');
  await expect(page.locator(status.scanDate)).toBeVisible();
});

test('an admin changes the scrub interval, and the dialog refuses one under a day', async ({ page, api }) => {
  // Not seeded over the API: the dialog fills the field from the app's store,
  // which read the advanced config at sign-in, before the test body runs. So the
  // field shows the interval as the run found it. Reopening after the change
  // below is what shows the dialog reads the config rather than a default.
  const before = await readBootScrubInterval(api);
  const changedInterval = changedIntervalFrom(before);

  await goToBootEnvironments(page);
  await openBootPoolStats(page);
  await expect(page.locator(statsDialog.interval)).toHaveValue(String(before));

  await page.locator(statsDialog.interval).fill('0');
  await expect(page.locator(statsDialog.updateInterval)).toBeDisabled();
  expect(await readBootScrubInterval(api)).toBe(before);

  await page.locator(statsDialog.interval).fill(String(changedInterval));
  await expect(page.locator(statsDialog.updateInterval)).toBeEnabled();
  await page.locator(statsDialog.updateInterval).click();
  await expect(page.locator(statsDialog.title)).toBeHidden({ timeout: activateTimeoutMs });

  expect(await readBootScrubInterval(api)).toBe(changedInterval);

  await openBootPoolStats(page);
  await expect(page.locator(statsDialog.interval)).toHaveValue(String(changedInterval));
});

test('an admin activates another boot environment, then the original again', async ({ page, api }) => {
  const running = await findRunningBootEnvironment(api);
  await ensureBootEnvironmentPresent(api, cloneName);

  // Activate is not offered on a boot environment middleware says cannot be activated.
  expect(
    (await findBootEnvironment(api, cloneName))?.can_activate,
    'boot.environment.query should allow a fresh clone to be activated',
  ).toBe(true);

  await goToBootEnvironments(page);

  await test.step('the clone is set to boot next', async () => {
    await activateBootEnvironment(page, cloneName);

    await expect(page.locator(list.active(cloneName))).toHaveText('Restart', { timeout: activateTimeoutMs });
    await expect(page.locator(list.active(running.id))).toHaveText('Now');

    expect(await findBootEnvironment(api, cloneName)).toMatchObject({ activated: true });
    expect(await findBootEnvironment(api, running.id)).toMatchObject({ active: true, activated: false });
  });

  await test.step('the running one is set to boot next again', async () => {
    await activateBootEnvironment(page, running.id);

    await expect(page.locator(list.active(cloneName))).toHaveText('No', { timeout: activateTimeoutMs });
    await expect(page.locator(list.active(running.id))).toHaveText('Now');

    expect(await findBootEnvironment(api, running.id)).toMatchObject({ active: true, activated: true });
    expect(await findBootEnvironment(api, cloneName)).toMatchObject({ activated: false });
  });
});

test('an admin mirrors the boot pool onto an unused disk, and detaches it again', async ({ page, api }) => {
  const startingDisks = await listBootDisks(api);
  // Teardown detaches only what is not in this list, so it cannot be guessed:
  // on a boot pool that is mirrored already, there is no telling which disk the
  // appliance was installed on.
  expect(startingDisks, 'the boot pool should start on a single disk').toHaveLength(1);
  originalBootDisks = startingDisks;

  const bootDevice = await findBootDevice(api);
  await requireUnusedDisks(api, 1);
  const disk = await pickUnusedDisk(api);
  attachedDisk = disk;

  await goToBootEnvironments(page);
  await openBootPoolStatus(page, bootDevice);

  await test.step('the disk is attached as a mirror', async () => {
    await attachBootDisk(page, bootDevice, disk);

    expect(await listBootDisks(api)).toEqual([...startingDisks, disk].sort((a, b) => a.localeCompare(b)));

    const [mirror, ...others] = await findBootPoolTopology(api);
    if (!mirror) {
      throw new Error('boot.get_state reports no device in the boot pool after the attach');
    }
    expect(others).toHaveLength(0);
    expect(mirror.type).toBe('MIRROR');
    expect(mirror.children).toHaveLength(2);

    // The page reloads the boot pool once the dialog closes. The mirror is drawn
    // collapsed, so its disks are reached through its toggle.
    await expect(page.locator(status.deviceName(mirror.name))).toBeVisible();
    await page.locator(status.toggle(mirror.guid)).click();
    for (const device of mirror.children) {
      await expect(page.locator(status.deviceName(device.name))).toBeVisible();
    }
  });

  await test.step('the mirror is detached', async () => {
    const [mirror] = await findBootPoolTopology(api);
    const mirrorName = mirror?.name ?? '';

    // The menu is rendered only on a mirror whose topology entry carries a `path`.
    await expect(
      page.locator(status.actions(mirrorName)),
      `Boot Pool Status should offer an actions menu on "${mirrorName}"`,
    ).toBeVisible();
    await page.locator(status.actions(mirrorName)).click();
    await page.locator(status.detach).click();

    await expect(page.locator(header.status)).toBeVisible({ timeout: activateTimeoutMs });
    await expect.poll(() => listBootDisks(api), { timeout: activateTimeoutMs }).toEqual(startingDisks);
    expect(await findBootDevice(api)).toBe(bootDevice);

    await openBootPoolStatus(page, bootDevice);
    await expect(page.locator(status.deviceName(mirrorName))).toHaveCount(0);
  });
});
