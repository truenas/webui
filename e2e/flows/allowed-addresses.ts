/**
 * The Allowed IP Addresses card, driven through the UI from System > Advanced Settings.
 *
 * Saving the form and deleting from the card both end in webui's "Restart Web Service" prompt. These flows always
 * decline it: in CI the UI reaches the appliance through a separate nginx, and a web service restart can cut the
 * run off. Declining leaves the allowlist saved, which is what the tests read back.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { allowedAddressesLocators } from '../locators/allowed-addresses';
import { confirmDialogLocators } from '../locators/dialogs';

/** A `system.general.update` reconfigures the web service before it returns, so it is not instant. */
const saveTimeoutMs = 60_000;

/** Waits for the restart prompt that follows a saved allowlist, and declines it. */
async function declineWebServiceRestart(page: Page): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toContainText('Restart Web Service', {
    timeout: saveTimeoutMs,
  });
  await page.locator(confirmDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Opens the Configure form from the card, starting from the sidebar.
 *
 * Waits on each saved address having been patched in at its position, which is what says the form has loaded
 * rather than showing an empty list.
 */
export async function openAllowedAddressesForm(page: Page, saved: string[]): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(allowedAddressesLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(allowedAddressesLocators.form.add)).toBeVisible();
  for (const [index, address] of saved.entries()) {
    await expect(page.locator(allowedAddressesLocators.form.address(index))).toHaveValue(address);
  }
}

/** Appends an empty row to the form's list and fills it. `index` is the position the new row takes. */
export async function addAllowedAddress(page: Page, index: number, address: string): Promise<void> {
  await page.locator(allowedAddressesLocators.form.add).click();
  await page.locator(allowedAddressesLocators.form.address(index)).fill(address);
}

/**
 * Saves the form, declines the restart, and waits for the panel to close.
 *
 * The prompt is raised only after the update returned, and the panel closes only once it is answered, so the
 * panel closing is the app's own signal that the save succeeded.
 */
export async function saveAllowedAddressesForm(page: Page): Promise<void> {
  await page.locator(allowedAddressesLocators.form.save).click();
  await declineWebServiceRestart(page);
  await expect(page.locator(allowedAddressesLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Closes the panel without saving. It has been edited, so the panel asks first. */
export async function discardAllowedAddressesForm(page: Page): Promise<void> {
  await page.locator(allowedAddressesLocators.form.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(allowedAddressesLocators.form.save)).toBeHidden();
}

/**
 * Deletes an address from its row through webui's shared confirm, declines the restart, and waits for the row
 * to go, starting from the sidebar.
 *
 * The confirm is raised without `hideCheckbox`, so Delete stays disabled until ticked; asserted, so a dialog
 * that lost its gate fails here. The card reloads only after the restart prompt is answered, so the row is what
 * is waited on. No first-time warning: the card raises it only in front of the form.
 */
export async function deleteAllowedAddress(page: Page, address: string): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(allowedAddressesLocators.card.delete(address)).click();
  await expect(page.locator(confirmDialogLocators.title)).toContainText('Delete Allowed Address');

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await declineWebServiceRestart(page);
  await expect(page.locator(allowedAddressesLocators.card.row(address))).toBeHidden({ timeout: saveTimeoutMs });
}
