/**
 * Stories: from the Storage card on System > Advanced Settings, an admin moves
 * the system dataset onto a data pool and back to the boot pool, and sets
 * resilvering to run at higher priority on weekend nights. The form refuses
 * priority resilvering with no days picked.
 *
 * Each save is asserted on the card and through `systemdataset.config` and
 * `pool.resilver.config`.
 *
 * ## Saving sends only what changed
 *
 * The form saves the pool through the `systemdataset.update` job and the
 * resilvering window through `pool.resilver.update`, and only the sections that
 * are dirty. Re-sending an untouched section would send back the values the
 * form loaded, which leaves the config exactly as it was, so the config alone
 * cannot show it was not sent. Hence `recordApiCalls`: a move must not call
 * `pool.resilver.update`, and a resilvering change must start no
 * `systemdataset.update` job. The resilvering test is also what shows the
 * recorder sees `pool.resilver.update` at all.
 *
 * ## Teardown
 *
 * Both settings are global. Before the first test this file records where the
 * system dataset is and the whole resilvering window, and before and after
 * every test writes both back, the system dataset first: a later spec that
 * exports a pool holding it would fail. Each write is skipped when nothing
 * differs, because every move restarts services.
 *
 * Not covered: the SMB reboot warning, the Export/Disconnect dialog's and the
 * Datasets page's system dataset warnings, and whether a resilver really runs
 * faster in the window.
 */
import {
  findSystemDatasetMoveJobIds,
  moveSystemDataset,
  readBootPoolName,
  readResilverConfig,
  readSystemDatasetPool,
  setResilverConfig,
  type ResilverSettings,
} from '../fixtures/system-dataset';
import {
  chooseResilverWindow,
  chooseSystemDatasetPool,
  discardStorageSettingsForm,
  openStorageSettingsForm,
  saveStorageSettingsForm,
  toggleResilverWeekdays,
} from '../flows/advanced-storage';
import { advancedStorageLocators } from '../locators/advanced-storage';
import { apiCallsTo } from '../support/api-calls';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

/** Middleware's own default: off, 18:00 to 09:00, every day. */
const resilverBaseline: ResilverSettings = {
  enabled: false,
  begin: '18:00',
  end: '09:00',
  weekday: [1, 2, 3, 4, 5, 6, 7],
};

/**
 * Seeded while the system dataset moves. Neither middleware's default nor the
 * form's, so reading it back can only mean nothing overwrote it.
 */
const resilverSeed: ResilverSettings = {
  enabled: true,
  begin: '02:00',
  end: '04:00',
  weekday: [2, 4],
};

/** Saturday and Sunday, 01:00 to 05:00: what the third story saves and the fourth starts from. */
const weekendNights: ResilverSettings = {
  enabled: true,
  begin: '01:00',
  end: '05:00',
  weekday: [6, 7],
};

/** `Validators.required`, as `tn-form-field-errors.provider.ts` words it. */
const requiredMessage = 'Field is required';

/** What the appliance held before this file ran, and therefore what every test is put back to. */
let found: { pool: string; resilver: ResilverSettings } | undefined;

let bootPool = '';

/**
 * Asks for `pool` here, before anything is recorded, because the fixture is lazy
 * and building a pool can move the system dataset onto it. Left to the first
 * test that names it, that would happen after the test's own seed.
 */
test.beforeAll(async ({ api, pool }) => {
  bootPool = await readBootPoolName(api);
  if (pool === bootPool) {
    throw new Error(`The data pool "${pool}" is the boot pool, so there is nowhere to move the system dataset to.`);
  }

  found = {
    pool: await readSystemDatasetPool(api),
    resilver: await readResilverConfig(api),
  };
});

/** The system dataset first, before anything a later spec exports; then the resilvering window. */
async function restoreFound(api: E2eApiClient): Promise<void> {
  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found === undefined) {
    return;
  }

  const { pool, resilver } = found;
  await runCleanupSteps([
    [`move the system dataset back to "${pool}"`, () => moveSystemDataset(api, pool)],
    ['write the resilvering window back', () => setResilverConfig(api, resilver)],
  ]);
}

/** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api }) => {
  await restoreFound(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the system dataset and the resilvering window as the test left them')) {
    return;
  }

  await restoreFound(api);
});

/**
 * Each story seeds its starting state in a hook, like the second console test,
 * so it is in place before `page` signs in. A move restarts services, and the
 * app should not be watching while the seed does it.
 */
test.describe('starting on the boot pool', () => {
  test.beforeEach(async ({ api }) => {
    await moveSystemDataset(api, bootPool);
    await setResilverConfig(api, resilverSeed);
  });

  test('an admin moves the system dataset onto a data pool', async ({ page, api, pool }) => {
    const { card } = advancedStorageLocators;

    await openStorageSettingsForm(page, bootPool);
    await chooseSystemDatasetPool(page, pool);
    await saveStorageSettingsForm(page);

    await expect(page.locator(card.systemDatasetPool)).toHaveText(pool);

    expect(await readSystemDatasetPool(api)).toBe(pool);
    expect(await readResilverConfig(api)).toEqual(resilverSeed);
    expect(apiCallsTo(page, 'pool.resilver.update')).toEqual([]);
  });
});

test.describe('starting on the data pool', () => {
  test.beforeEach(async ({ api, pool }) => {
    await moveSystemDataset(api, pool);
    await setResilverConfig(api, resilverSeed);
  });

  test('an admin moves the system dataset back to the boot pool', async ({ page, api, pool }) => {
    const { card } = advancedStorageLocators;

    await openStorageSettingsForm(page, pool);
    await chooseSystemDatasetPool(page, bootPool);
    await saveStorageSettingsForm(page);

    await expect(page.locator(card.systemDatasetPool)).toHaveText(bootPool);

    expect(await readSystemDatasetPool(api)).toBe(bootPool);
    expect(await readResilverConfig(api)).toEqual(resilverSeed);
    expect(apiCallsTo(page, 'pool.resilver.update')).toEqual([]);
  });
});

test.describe('with priority resilvering off', () => {
  test.beforeEach(async ({ api }) => {
    await setResilverConfig(api, resilverBaseline);
  });

  test('an admin runs resilvering at higher priority on weekends at night', async ({ page, api }) => {
    const { card, form } = advancedStorageLocators;
    const systemDatasetPool = await readSystemDatasetPool(api);
    const movesBefore = await findSystemDatasetMoveJobIds(api);

    await openStorageSettingsForm(page, systemDatasetPool);
    // The starting state the save has to change, read off the card behind the panel.
    await expect(page.locator(card.priorityResilver)).toHaveText('Never');

    await page.locator(form.enabled).click();
    await expect(page.locator(form.enabled)).toBeChecked();
    await toggleResilverWeekdays(page, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    await chooseResilverWindow(page, '01:00:00', '05:00:00');
    await saveStorageSettingsForm(page);

    await expect(page.locator(card.priorityResilver)).toHaveText('Between 01:00 and 05:00 on weekends');

    expect(await readResilverConfig(api)).toEqual(weekendNights);
    expect(apiCallsTo(page, 'pool.resilver.update').map((call) => call.answer)).toEqual(['result']);
    // The pool was not touched, so no move was sent and none started.
    expect(await readSystemDatasetPool(api)).toBe(systemDatasetPool);
    expect(apiCallsTo(page, 'systemdataset.update')).toEqual([]);
    expect(await findSystemDatasetMoveJobIds(api)).toEqual(movesBefore);
  });
});

test.describe('with priority resilvering on', () => {
  test.beforeEach(async ({ api }) => {
    await setResilverConfig(api, weekendNights);
  });

  test('the form refuses priority resilvering with no days', async ({ page, api }) => {
    const { card, form } = advancedStorageLocators;

    await openStorageSettingsForm(page, await readSystemDatasetPool(api));
    await expect(page.locator(card.priorityResilver)).toHaveText('Between 01:00 and 05:00 on weekends');
    await expect(page.locator(form.weekdayField)).not.toContainText(requiredMessage);

    // Saturday and Sunday are the only days ticked, so this unticks every one.
    await toggleResilverWeekdays(page, ['Saturday', 'Sunday']);

    await expect(page.locator(form.weekdayField)).toContainText(requiredMessage);
    await expect(page.locator(form.save)).toBeDisabled();
    await discardStorageSettingsForm(page);

    expect(await readResilverConfig(api)).toEqual(weekendNights);
    expect(apiCallsTo(page, 'pool.resilver.update')).toEqual([]);
  });
});
