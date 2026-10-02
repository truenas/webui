/**
 * Stories: what a share needs from the SMB service, and the switches on the card.
 *
 * A Time Machine share requires Apple SMB2/3 extensions, a setting on the
 * *service*. While they are off `extraDisabled` holds Save down and the form
 * offers to turn them on; that write (`smb.update`) outlives the share, so this
 * spec puts it back. It also starts the service, which is global state, and
 * stops it again whatever the test did. The "Restart SMB Service" prompt is
 * deliberately not covered — see the known gaps in `docs/status.md`.
 */
import { ensureServiceRunning, queryService } from '../fixtures/services';
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
  readSmbAppleExtensions, setSmbAppleExtensions, smbServiceName,
} from '../fixtures/smb';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToDatasets, goToShares } from '../flows/navigation';
import { choosePurpose, openAddShareForm } from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Typed into the form and never saved — the Time Machine test stops at the gate. */
const timeMachineShare = 'e2e_service_tm_share';
/** Provisioned over the API, for the switches to act on. */
const toggledShare = 'e2e_service_toggle_share';

/** The path both of them point at. */
const datasetName = 'e2e_service_smb_ds';

const purpose = { timeMachine: 'Time Machine Share' } as const;

/** What a left-behind running service would cost the next run, said once. */
const serviceCost = 'the SMB service was left running, so the next run is offered a restart where it expects a start.';

/**
 * Apple extensions as this spec found them, put back in teardown. Undefined
 * until read, so a `beforeEach` that failed before reading it restores nothing.
 */
let appleExtensionsWereOn: boolean | undefined;

/**
 * Preconditions are *established* here, not asserted in the tests.
 *
 * Including Apple extensions, which are forced off: a run that failed partway
 * could leave them on. The hook does not take `page`, so it runs before one
 * exists — the app reads service state into its store at start-up.
 */
test.beforeEach(async ({ api, pool }) => {
  appleExtensionsWereOn = undefined;
  await ensureSmbShareAbsent(api, toggledShare);

  appleExtensionsWereOn = await readSmbAppleExtensions(api);
  await setSmbAppleExtensions(api, false);

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

/**
 * The service first, then what it served, then the storage under that. The
 * Apple-extensions write goes back after the share is gone: middleware refuses
 * to turn the flag off while a share that needs it exists.
 */
test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`share "${toggledShare}", dataset "${pool}/${datasetName}", SMB as the test left it, and Apple extensions unrestored`)) {
    return;
  }

  await runCleanupSteps([
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
    [`remove share ${toggledShare}`, () => ensureSmbShareAbsent(api, toggledShare)],
    ['restore Apple extensions', async () => {
      if (appleExtensionsWereOn !== undefined) {
        await setSmbAppleExtensions(api, appleExtensionsWereOn);
      }
    }],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('a Time Machine share cannot be saved until the service supports it', async ({ page, api, pool }) => {
  await openAddShareForm(page);
  await page.locator(smbLocators.form.path).fill(datasetMountPath(`${pool}/${datasetName}`));
  await page.locator(smbLocators.form.name).fill(timeMachineShare);

  // Save is live on the default purpose, which is what makes the refusal below
  // attributable to the purpose rather than to an unfinished form.
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();

  await choosePurpose(page, purpose.timeMachine);

  // The refusal. Not a validation message on a field — `extraDisabled` holds
  // the whole form down while the banner is up, so there is nothing to correct
  // and nowhere to correct it except the banner itself.
  await expect(page.locator(smbLocators.form.save)).toBeDisabled();
  await expect(page.locator(smbLocators.enableAppleExtensions)).toBeVisible();

  await page.locator(smbLocators.enableAppleExtensions).click();
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();

  // And it wrote to the *service*, not just to the form's own copy of the
  // config — which is the part that outlives this test and has to be undone.
  await expect.poll(() => readSmbAppleExtensions(api)).toBe(true);
});

test('switching a share off from the list reaches the appliance', async ({ page, api }) => {
  expect((await findSmbShare(api, toggledShare))?.enabled).toBe(true);

  await goToShares(page);
  await page.locator(smbLocators.card.enabledToggle(toggledShare)).click();

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
  await page.locator(smbLocators.card.enabledToggle(toggledShare)).click();
  await expect.poll(async () => (await findSmbShare(api, toggledShare))?.enabled).toBe(true);

  expect((await queryService(api, smbServiceName))?.state).toBe('RUNNING');
});

test('the switch on the card stops the service and starts it again', async ({ page, api }) => {
  await goToShares(page);
  await expect(page.locator(smbLocators.card.serviceStatus)).toHaveText('Running');

  await page.locator(smbLocators.card.serviceToggle).click();

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
