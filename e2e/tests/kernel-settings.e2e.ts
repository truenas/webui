/**
 * Story: an admin turns the debug kernel on from the Kernel card on
 * System > Advanced Settings, and then off again, and the appliance keeps each.
 *
 * Each save is asserted twice, as `console-settings.e2e.ts` does: the card's
 * readout says the screen believed it, `system.advanced.config` says the
 * appliance did it. Whether the debug kernel boots needs a reboot and is out of
 * scope; the stored setting is the claim.
 *
 * The setting is one field of one config record, so there is nothing to delete.
 * The value the appliance held is read once and written back.
 */
import { readDebugKernel, setDebugKernel } from '../fixtures/kernel';
import { openKernelForm, saveKernelForm } from '../flows/kernel';
import { goToAdvancedSettings } from '../flows/navigation';
import { kernelLocators } from '../locators/kernel';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/**
 * What the appliance held before the first test in this file changed it.
 *
 * Read once per worker, as `startingProfile` is in `dashboard-update-state.e2e.ts`:
 * a second read after a failed restore would record this file's own value as the
 * appliance's. A new worker reads it again, so that holds only within one.
 */
let startingDebugKernel: boolean | undefined;

test.beforeEach(async ({ api }) => {
  startingDebugKernel ??= await readDebugKernel(api);
  await setDebugKernel(api, false);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the debug kernel setting as the test left it')) {
    return;
  }

  // Guarded: Playwright runs this even when `beforeEach` threw before reading,
  // and writing `undefined` would be serialized as `null`.
  await runCleanupSteps([
    ['restore the debug kernel setting', async () => {
      if (startingDebugKernel !== undefined && await readDebugKernel(api) !== startingDebugKernel) {
        await setDebugKernel(api, startingDebugKernel);
      }
    }],
  ]);
});

test('an admin turns the debug kernel on, and then off', async ({ page, api }) => {
  const readout = page.locator(kernelLocators.card.debugKernel);
  const checkbox = page.locator(kernelLocators.form.debugKernel);

  await goToAdvancedSettings(page);
  await expect(readout).toHaveText('Disabled');

  await openKernelForm(page, true);
  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await saveKernelForm(page);

  await expect(readout).toHaveText('Enabled');
  expect(await readDebugKernel(api)).toBe(true);

  // The form is filled from the store, which the save refreshed.
  await openKernelForm(page, false);
  await expect(checkbox).toBeChecked();
  await checkbox.click();
  await saveKernelForm(page);

  await expect(readout).toHaveText('Disabled');
  expect(await readDebugKernel(api)).toBe(false);
});
