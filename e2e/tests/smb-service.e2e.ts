/**
 * Story: Time Machine needs something from the service before it will save.
 *
 * A Time Machine share requires Apple SMB2/3 protocol extensions, which are a
 * setting on the *service*, not on the share. While they are off the form does
 * not merely warn — `extraDisabled` holds Save down — and it offers to turn
 * them on from inside the form. That is the only route from that purpose to a
 * saved share, and the write it performs (`smb.update`) outlives the share, so
 * this spec puts it back.
 *
 * ## What this spec deliberately does *not* cover
 *
 * The "Restart SMB Service" prompt. It looked like the interesting rule here
 * and it is not what the code does: `isRestartRequired` is
 * `this.isNew || this.form.dirty`, so the prompt appears for **every** new
 * share and every edit while the service is running, Time Machine or not. The
 * Time Machine transition logic that the surrounding comments describe lives in
 * `isNewTimeMachineShare`, which is referenced nowhere in `src/` — see
 * `docs/status.md`. Pinning the current behaviour would encode something that
 * reads as unintended, so it waits on a product answer.
 *
 * **This spec starts the SMB service, which is global state.** It is stopped
 * again unconditionally: `CLAUDE.md` names leaving it running as the failure
 * mode a passing suite hides.
 */
import { ensureServiceRunning, queryService } from '../fixtures/services';
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
  readSmbAppleExtensions, setSmbAppleExtensions, smbServiceName,
} from '../fixtures/smb';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToShares } from '../flows/navigation';
import { choosePurpose, openAddShareForm } from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { expect, test } from '../support/fixtures';

const timeMachineShare = 'e2e_service_tm_share';
const toggledShare = 'e2e_service_toggle_share';

const allShares = [timeMachineShare, toggledShare];

/**
 * Two datasets, not one.
 *
 * Publishing a share puts an ACL on its path, and the form only raises the
 * "Configure ACL" question when `filesystem.stat(path).acl` is already true.
 * One shared path would mean the toggle test's fixture share silently changed
 * which prompts the *form* test is owed — an order dependency that reads as a
 * flaky dialog.
 */
const datasetName = 'e2e_service_smb_ds';
const toggleDatasetName = 'e2e_service_toggle_ds';

const purpose = { timeMachine: 'Time Machine Share' } as const;

/** What a left-behind running service would cost the next run, said once. */
const serviceCost = 'the SMB service was left running, so the next run is offered a restart where it expects a start.';

/** Apple extensions as this spec found them, put back in teardown. */
let appleExtensionsWereOn = false;

/**
 * Preconditions are *established* here, not asserted in the tests.
 *
 * Including Apple extensions, which are forced off: a previous run that failed
 * partway could leave them on, and a test that merely asserted they were off
 * would fail for a reason having nothing to do with what it covers.
 *
 * This hook takes only `api`, so it runs before `page` exists — which matters
 * for the service, since the app reads service state into its store at
 * start-up.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const share of allShares) {
    await ensureSmbShareAbsent(api, share);
  }

  appleExtensionsWereOn = await readSmbAppleExtensions(api);
  await setSmbAppleExtensions(api, false);

  await ensureDatasetPresent(api, `${pool}/${datasetName}`);
  await ensureDatasetPresent(api, `${pool}/${toggleDatasetName}`);
  await ensureSmbSharePresent(api, {
    name: toggledShare,
    path: datasetMountPath(`${pool}/${toggleDatasetName}`),
  });
  await ensureServiceRunning(api, smbServiceName, serviceCost);
});

/**
 * Order matters, and middleware enforces it: `aapl_extensions` cannot be turned
 * back off while a Time Machine share exists — `[EINVAL] ... must be enabled
 * when AFP, time machine, or Final Cut Pro shares are present`. So the shares
 * go first, and only then the service configuration they required.
 */
test.afterEach(async ({ api, pool }) => {
  await ensureSmbServiceStopped(api);
  for (const share of allShares) {
    await ensureSmbShareAbsent(api, share);
  }
  await setSmbAppleExtensions(api, appleExtensionsWereOn);
  await ensureDatasetAbsent(api, `${pool}/${datasetName}`);
  await ensureDatasetAbsent(api, `${pool}/${toggleDatasetName}`);
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

  // Reloaded before going back, rather than clicking the same switch twice.
  // `onChangeEnabledState` computes the new value from the row it was handed
  // (`!row.enabled`), so a second click against a row the card has not finished
  // reloading writes the value that is already there and nothing appears to
  // happen.
  //
  // Waiting on the switch's own checked state would be the better shape and is
  // not available: `tn-slide-toggle` puts the `data-test` on its `<label for>`,
  // not on the input, so `toBeChecked()` has nothing to read and passes
  // vacuously — tried, and the re-enable still failed. A reload is the honest
  // way to get a row the card has definitely rebuilt.
  await page.reload();
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
