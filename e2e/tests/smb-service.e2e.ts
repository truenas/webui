/**
 * Stories: what a share needs from the SMB service, and the switches on the card. Apple SMB2/3 extensions are
 * always on now, so a Time Machine share no longer asks for them. The spec starts the service, which is global
 * state, and stops it whatever the test did. The "Restart SMB Service" prompt is deliberately not covered; see the
 * known gaps in `docs/status.md`.
 */
import { ensureServiceRunning, queryService } from '../fixtures/services';
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
  smbServiceName,
} from '../fixtures/smb';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToDatasets, goToShares } from '../flows/navigation';
import { confirmServiceStop } from '../flows/services';
import {
  choosePurpose, formSettleTimeoutMs, openAddShareForm, toggleShareEnabled,
} from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Typed into the form and never saved — the Time Machine test stops at Save. */
const timeMachineShare = 'e2e_service_tm_share';
/** Provisioned over the API, for the switches to act on. */
const toggledShare = 'e2e_service_toggle_share';

/** The path both of them point at. */
const datasetName = 'e2e_service_smb_ds';

const purpose = { timeMachine: 'Time Machine Share' } as const;

/** What a left-behind running service would cost the next run, said once. */
const serviceCost = 'the SMB service was left running, so the next run is offered a restart where it expects a start.';

/**
 * Preconditions are *established* here, not asserted in the tests.
 *
 * The hook does not take `page`, so it runs before one exists — the app reads
 * service state into its store at start-up.
 */
test.beforeEach(async ({ api, pool }) => {
  // Never saved by this spec; removed in case a run that failed partway did.
  await ensureSmbShareAbsent(api, timeMachineShare);
  await ensureSmbShareAbsent(api, toggledShare);

  await ensureDatasetPresent(api, `${pool}/${datasetName}`);
  await ensureSmbSharePresent(api, {
    name: toggledShare,
    path: datasetMountPath(`${pool}/${datasetName}`),
  });

  // Stopped first, and not for the stop: that is what clears start-at-boot,
  // which `ensureServiceRunning` leaves as it finds it. The card-switch test
  // asserts the flag is still off afterwards, so it has to be off beforehand.
  await ensureSmbServiceStopped(api);
  await ensureServiceRunning(api, smbServiceName, serviceCost);
});

/** The service first, then what it served, then the storage under that. */
test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`share "${toggledShare}", dataset "${pool}/${datasetName}", and SMB as the test left it`)) {
    return;
  }

  await runCleanupSteps([
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
    [`remove share ${timeMachineShare}`, () => ensureSmbShareAbsent(api, timeMachineShare)],
    [`remove share ${toggledShare}`, () => ensureSmbShareAbsent(api, toggledShare)],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('a Time Machine share can be saved without changing the service', async ({ page, pool }) => {
  await openAddShareForm(page);
  await page.locator(smbLocators.form.path).fill(datasetMountPath(`${pool}/${datasetName}`));
  await page.locator(smbLocators.form.name).fill(timeMachineShare);
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();

  await choosePurpose(page, purpose.timeMachine);

  // Time Machine used to hold Save down until Apple extensions were turned on
  // in the service. They are always on now, so the purpose changes nothing.
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();
});

test('switching a share off from the list reaches the appliance', async ({ page, api }) => {
  expect((await findSmbShare(api, toggledShare))?.enabled).toBe(true);

  await goToShares(page);
  await toggleShareEnabled(page, toggledShare);

  // A switch is the easiest control in the app to leave purely cosmetic — it
  // moves on click whether or not anything was written. The appliance is the
  // only place that can say otherwise.
  await expect.poll(async () => (await findSmbShare(api, toggledShare))?.enabled).toBe(false);

  // Left and come back to, rather than clicking the same switch twice.
  // `onChangeEnabledState` computes the new value from the row it was handed
  // (`!row.enabled`), so a second click against a row the card has not reloaded
  // writes the value that is already there. The switch's own checked state is
  // no guard: it flips on click, before the rows reload. Leaving the page
  // destroys the card, so the row that comes back is one it has rebuilt.
  await goToDatasets(page);
  await goToShares(page);
  await toggleShareEnabled(page, toggledShare);
  await expect.poll(async () => (await findSmbShare(api, toggledShare))?.enabled).toBe(true);

  expect((await queryService(api, smbServiceName))?.state).toBe('RUNNING');
});

test('the switch on the card stops the service and starts it again', async ({ page, api }) => {
  await goToShares(page);
  await expect(page.locator(smbLocators.card.serviceStatus))
    .toHaveText('Running', { timeout: formSettleTimeoutMs });

  // Stopping asks first, as it does from System > Services; starting does not.
  await page.locator(smbLocators.card.serviceToggle).click();
  await confirmServiceStop(page);

  await expect
    .poll(async () => (await queryService(api, smbServiceName))?.state, { timeout: 90_000 })
    .toBe('STOPPED');
  // Waited for before the second click, and not only as an assertion: the
  // switch decides between start and stop from the state the card holds, so
  // clicking it again before the card has heard about the stop asks for another.
  await expect(page.locator(smbLocators.card.serviceStatus)).toHaveText('Stopped');

  await page.locator(smbLocators.card.serviceToggle).click();

  await expect
    .poll(async () => (await queryService(api, smbServiceName))?.state, { timeout: 90_000 })
    .toBe('RUNNING');
  await expect(page.locator(smbLocators.card.serviceStatus)).toHaveText('Running');

  // The switch is on and off, not enabled at boot. `service.update` is a
  // different control, and a start from here must not turn into one.
  expect((await queryService(api, smbServiceName))?.enable).toBe(false);
});
